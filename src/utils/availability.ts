import { AvailabilityUI } from "@/hooks/useAvailability";
import { format, addMinutes, isBefore, isEqual, addDays } from "date-fns";


export const CONFIG = {
    DEFAULT_SLOT_DURATION: 30,
    DEFAULT_BREAK_DURATION: 10,
    DEFAULT_START_TIME: "09:00",
    DAYS_AHEAD_TO_PLAN: 14,
};



export const parseTimeForDate = (timeStr: string, dateBaseStr: string): Date => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateBaseStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
};




export type DateOption = {
    value: string;
    label: string;
};

export const getAvailableDatesOptions = (daysCount: number = CONFIG.DAYS_AHEAD_TO_PLAN): DateOption[] => {
    return Array.from({ length: daysCount }, (_, i) => {
        const date = addDays(new Date(), i + 1);
        
        return {
            value: date.toISOString().split('T')[0],
            label: format(date, 'EEE, MMM d, yyyy')
        };
    });
};



export const calculateNextSlotTimes = (lastSlot: AvailabilityUI | undefined, dateStr: string) => {
    if (!lastSlot) {
        const start = parseTimeForDate(CONFIG.DEFAULT_START_TIME, dateStr);
        const end = addMinutes(start, CONFIG.DEFAULT_SLOT_DURATION);
        return {
            newStart: format(start, 'HH:mm'),
            newEnd: format(end, 'HH:mm'),
            duration: CONFIG.DEFAULT_SLOT_DURATION
        };
    }

    const lastEndObj = parseTimeForDate(lastSlot.end_time, dateStr);
    const nextStartObj = addMinutes(lastEndObj, CONFIG.DEFAULT_BREAK_DURATION);
    const nextEndObj = addMinutes(nextStartObj, lastSlot.duration);

    return {
        newStart: format(nextStartObj, 'HH:mm'),
        newEnd: format(nextEndObj, 'HH:mm'),
        duration: lastSlot.duration
    };
};



export const generateSlotsUntilLimit = (
    lastSlot: AvailabilityUI,
    limitTime: string,
    selectedDate: string
): AvailabilityUI[] => {
    const endObj = parseTimeForDate(lastSlot.end_time, selectedDate);
    const limitObj = parseTimeForDate(limitTime, selectedDate);

    let currentStart = addMinutes(endObj, CONFIG.DEFAULT_BREAK_DURATION);
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

        currentStart = addMinutes(currentEnd, CONFIG.DEFAULT_BREAK_DURATION);
    }

    return newSlots;
};




export const getSlotWarning = (currentSlot: AvailabilityUI, allSlots: AvailabilityUI[], dateStr: string): string | null => {
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
            if (gapMinutes < CONFIG.DEFAULT_BREAK_DURATION && gapMinutes >= 0) {
                return `Break too short (<${CONFIG.DEFAULT_BREAK_DURATION}m) after ${otherSlot.end_time}`;
            }
        }
    }

    return null;
};
