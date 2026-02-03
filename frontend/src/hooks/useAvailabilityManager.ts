import { useState, useEffect, useMemo } from "react";
import { useAvailability, AvailabilityUI, AvailabilityDB } from "@/hooks/useAvailability";
import { useLocation, Location } from "@/hooks/useLocation";
import { calculateNextSlotTimes, generateSlotsUntilLimit, getAvailableDatesOptions, getSlotWarning, parseTimeForDate } from "@/lib/availability";
import { toast } from "sonner";
import { logError, logWarning } from "@/lib/logger";


export const useAvailabilityManager = (userId: string | undefined) => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    const [slots, setSlots] = useState<AvailabilityUI[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());
    const availableDates = useMemo(() => getAvailableDatesOptions(), []);


    const { getSlotsForDate, deleteSlots, insertSlots, getOccupiedDates, isLoading } = useAvailability(userId);
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
    }, [getSlotsForDate, selectedDate]);

    useEffect(() => {
        const fetchDates = async () => {
            const startDate = availableDates[0].value;
            const endDate = availableDates[availableDates.length - 1].value;

            const busyDates = await getOccupiedDates(startDate, endDate);
            setOccupiedDates(busyDates);
        };

        fetchDates();
    }, [getOccupiedDates, availableDates]);



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
        setSlots(prev => prev.map(slot => {
            if (slot.id !== id) return slot;

            const updatedSlot = { ...slot, [field]: value };

            if (field === 'start_time' || field === 'end_time') {
                const start = parseTimeForDate(updatedSlot.start_time, selectedDate);
                const end = parseTimeForDate(updatedSlot.end_time, selectedDate);

                const diffMs = end.getTime() - start.getTime();
                const diffMins = Math.round(diffMs / 60000);

                if (diffMins > 0) {
                    updatedSlot.duration = diffMins;
                }
            }

            return updatedSlot;
        }));
    };


    const removeSlot = (id: string) => {
        setSlots(prev => prev.filter(s => s.id !== id));
    };


    const saveChanges = async () => {
        if (!userId) return;
        setIsSaving(true);
        try {
            await deleteSlots(selectedDate);
            const dbSlots = prepareSlotsForDb(slots, selectedDate);
            if (dbSlots.length > 0) await insertSlots(dbSlots);

            const refreshed = await getSlotsForDate(selectedDate);
            setSlots(refreshed);
        } catch (error) {
            logError(`[Schedule] Save failed for ${selectedDate}:`, error, "useAvailabilityManager::saveChanges");
            toast.error("Save failed. Please try again");
        } finally {
            setIsSaving(false);
        }
    };


    const copyScheduleToDates = async (targetDates: string[]) => {
        if (!userId || targetDates.length === 0) return;

        setIsSaving(true);
        try {

            if (slots.length === 0) {
                logWarning("[Schedule] Attempted to copy empty slots. Operation aborted.", "useAvailabilityManager::copyScheduleToDates");
                toast.warning("No hours to copy. Please fill in the source day first.");
                return;
            }

            const promises = targetDates.map(async (targetDate) => {
                await deleteSlots(targetDate);
                const dbSlots = prepareSlotsForDb(slots, targetDate);
                if (dbSlots.length > 0) await insertSlots(dbSlots)
            });

            await Promise.all(promises);

            return true;
        } catch (error) {
            logError("[Schedule] Copy failed:", error, "useAvailabilityManager::copyScheduleToDates");
            toast.error("An error occurred while saving the changes. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const prepareSlotsForDb = (
        slotsToSave: AvailabilityUI[],
        targetDate: string
    ): Omit<AvailabilityDB, "id" | "duration">[] => {
        if (!userId) return [];
        return slotsToSave
            .filter(s => !s.is_booked)
            .map(slot => ({
                doctor_id: userId,
                location_id: slot.location_id,
                start_time: parseTimeForDate(slot.start_time, targetDate).toISOString(),
                end_time: parseTimeForDate(slot.end_time, targetDate).toISOString(),
                is_booked: false
            }));
    };


    const processedSlots = useMemo(() => {
        return slots.map((currentSlot) => {
            const warning = getSlotWarning(currentSlot, slots, selectedDate);

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


    return {
        selectedDate, setSelectedDate,
        slots: processedSlots,
        locations, setLocations,
        isLoading,
        isSaving,
        hasConflicts,
        hasMissingFields,
        occupiedDates,
        availableDates,

        addSingleSlot,
        generateMagicSlots,
        updateSlotField,
        removeSlot,
        saveChanges,
        copyScheduleToDates,
    };
};

