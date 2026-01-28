import { useState, useEffect, useMemo } from "react";
import { useAvailability, AvailabilityUI } from "@/hooks/useAvailability";
import { useLocation, Location } from "@/hooks/useLocation";
import { parseTimeForDate } from "@/app/(dashboard)/doctor/availability/page";
import { format, addMinutes, isBefore, isEqual } from "date-fns";

const DEFAULT_SLOT_DURATION = 30;
const DEFAULT_BREAK_DURATION = 10;
const DEFAULT_START_TIME = "09:00";


export const useAvailabilityManager = (userId: string | undefined) => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    const [slots, setSlots] = useState<AvailabilityUI[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    const { getSlotsForDate, deleteSlots, insertSlots, isLoading } = useAvailability(userId);
    const { getLocationsByQueryOrSpecialization } = useLocation(userId);

    useEffect(() => {
        const fetchLocs = async () => {
            const locs = await getLocationsByQueryOrSpecialization();
            if (locs) setLocations(locs);
        };
        fetchLocs();
    }, [getLocationsByQueryOrSpecialization]);

    useEffect(() => {
        const fetchSlots = async () => {
            const data = await getSlotsForDate(selectedDate);
            if (data) setSlots(data);
        };
        fetchSlots();
    }, [selectedDate, getSlotsForDate]);


    const addSingleSlot = () => {
        const lastSlot = slots[slots.length - 1];
        const { newStart, newEnd, duration } = calculateNextSlotTimes(lastSlot, selectedDate);

        const newSlot: AvailabilityUI = {
            id: Math.random().toString(36),
            start_time: newStart,
            end_time: newEnd,
            location_id: lastSlot?.location_id || "",
            duration: duration,
            is_booked: false,
            is_new: true
        };

        setSlots(prev => [...prev, newSlot]);
    };


    const generateMagicSlots = (endTime: string) => {
        if (slots.length === 0) return;

        const lastSlot = slots[slots.length - 1];
        const newSlots = generateSlotsUntilLimit(lastSlot, endTime, selectedDate);
        setSlots(prev => [...prev, ...newSlots]);
    };


    const updateSlotField = (id: string, field: keyof AvailabilityUI, value: string) => {
        setSlots(prev => prev.map(slot =>
            slot.id === id ? { ...slot, [field]: value } : slot
        ));
    };


    const removeSlot = (id: string) => {
        setSlots(prev => prev.filter(s => s.id !== id));
    };


    const saveChanges = async () => {
        if (!userId) return;
        setIsSaving(true);
        try {
            await deleteSlots(selectedDate);

            const dbSlots = slots
                .filter(s => !s.is_booked)
                .map(slot => ({
                    doctor_id: userId,
                    location_id: slot.location_id,
                    start_time: parseTimeForDate(slot.start_time, selectedDate).toISOString(),
                    end_time: parseTimeForDate(slot.end_time, selectedDate).toISOString(),
                    is_booked: false
                }));

            await insertSlots(dbSlots);

            const refreshed = await getSlotsForDate(selectedDate);
            setSlots(refreshed);
        } catch (error: any) {
            alert(`Save failed: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };


    const processedSlots = useMemo(() => {
        return slots.map((currentSlot) => {
            const warning = validateSlot(currentSlot, slots, selectedDate);
            
            return {
                ...currentSlot,
                conflictWarning: warning
            };
        });
    }, [slots, selectedDate]);

    const hasConflicts = useMemo(() =>
        processedSlots.some(s => s.conflictWarning !== null),
        [processedSlots]);

    const hasMissingFields = useMemo(() => {
        return slots.some(slot => 
            !slot.start_time || 
            !slot.end_time || 
            !slot.location_id
        );
    }, [slots]);


    const copyScheduleToDates = async (targetDates: string[]) => {
        if (!userId || targetDates.length === 0) return;

        setIsSaving(true);
        try {
            const slotsToCopy = slots.filter(s => !s.is_booked);

            if (slotsToCopy.length === 0) {
                alert("No available slots to copy.");
                return;
            }

            const promises = targetDates.map(async (targetDate) => {
                await deleteSlots(targetDate);

                const newSlotsForDB = slotsToCopy.map(slot => ({
                    doctor_id: userId,
                    location_id: slot.location_id,
                    start_time: parseTimeForDate(slot.start_time, targetDate).toISOString(),
                    end_time: parseTimeForDate(slot.end_time, targetDate).toISOString(),
                    is_booked: false
                }));

                if (newSlotsForDB.length > 0) {
                    await insertSlots(newSlotsForDB);
                }
            });

            await Promise.all(promises);

            return true;
        } catch (error: any) {
            console.error(error);
            alert(`Copy failed: ${error.message}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        selectedDate, setSelectedDate,
        slots: processedSlots,
        locations, setLocations,
        isLoading,
        isSaving,
        hasConflicts,
        hasMissingFields,

        addSingleSlot,
        generateMagicSlots,
        updateSlotField,
        removeSlot,
        saveChanges,
        copyScheduleToDates,
    };
};


const calculateNextSlotTimes = (lastSlot: AvailabilityUI | undefined, dateStr: string) => {
    if (!lastSlot) {
        const start = parseTimeForDate(DEFAULT_START_TIME, dateStr);
        const end = addMinutes(start, DEFAULT_SLOT_DURATION);
        return {
            newStart: format(start, 'HH:mm'),
            newEnd: format(end, 'HH:mm'),
            duration: DEFAULT_SLOT_DURATION
        };
    }

    const lastEndObj = parseTimeForDate(lastSlot.end_time, dateStr);
    const nextStartObj = addMinutes(lastEndObj, DEFAULT_BREAK_DURATION);
    const nextEndObj = addMinutes(nextStartObj, lastSlot.duration);

    return {
        newStart: format(nextStartObj, 'HH:mm'),
        newEnd: format(nextEndObj, 'HH:mm'),
        duration: lastSlot.duration
    };
};



const generateSlotsUntilLimit = (
    lastSlot: AvailabilityUI,
    limitTimeStr: string,
    dateStr: string
): AvailabilityUI[] => {
    const endObj = parseTimeForDate(lastSlot.end_time, dateStr);
    const limitObj = parseTimeForDate(limitTimeStr, dateStr);

    let currentStart = addMinutes(endObj, DEFAULT_BREAK_DURATION);
    const newSlots: AvailabilityUI[] = [];

    while (isBefore(currentStart, limitObj) || isEqual(currentStart, limitObj)) {
        const currentEnd = addMinutes(currentStart, lastSlot.duration);
        if (isBefore(limitObj, currentEnd)) break;

        newSlots.push({
            id: Math.random().toString(36).substr(2, 9),
            start_time: format(currentStart, 'HH:mm'),
            end_time: format(currentEnd, 'HH:mm'),
            location_id: lastSlot.location_id,
            duration: lastSlot.duration,
            is_booked: false,
            is_new: true
        });

        currentStart = addMinutes(currentEnd, DEFAULT_BREAK_DURATION);
    }

    return newSlots;
};




const validateSlot = (currentSlot: AvailabilityUI, allSlots: AvailabilityUI[], dateStr: string): string | null => {
    const myStart = parseTimeForDate(currentSlot.start_time, dateStr);
    const myEnd = parseTimeForDate(currentSlot.end_time, dateStr);

    if (myStart >= myEnd) {
        return "End time must be after start time";
    }

    for (const otherSlot of allSlots) {
        if (otherSlot.id === currentSlot.id) continue;

        const otherStart = parseTimeForDate(otherSlot.start_time, dateStr);
        const otherEnd = parseTimeForDate(otherSlot.end_time, dateStr);


        if (myStart < otherEnd && myEnd > otherStart) {
            return `Overlaps with ${otherSlot.start_time} - ${otherSlot.end_time}`;
        }

  
        if (otherEnd <= myStart) {
            const gapMinutes = (myStart.getTime() - otherEnd.getTime()) / 60000;
            if (gapMinutes < DEFAULT_BREAK_DURATION && gapMinutes >= 0) {
                 return `Break too short (<${DEFAULT_BREAK_DURATION}m) after ${otherSlot.end_time}`;
            }
        }
    }

    return null;
};