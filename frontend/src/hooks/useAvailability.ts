import { useCallback, useState } from "react"
import { supabase } from "@/lib/supabase";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { toast } from "sonner";
import { logError } from "@/lib/logger";


export type AvailabilityDB = {
    id: string;
    doctor_id: string;
    location_id: string;
    start_time: string;
    end_time: string;
    duration: number;
    is_booked: boolean;
};

export type AvailabilityUI = {
    id: string;
    start_time: string;
    end_time: string;
    location_id: string;
    duration: number;
    is_booked: boolean;
    is_new?: boolean;
};


export const useAvailability = (userId: string | undefined) => {
    const [isLoading, setIsLoading] = useState(false)

    const getSlotsForDate = useCallback(async (date: string): Promise<AvailabilityUI[]> => {
        setIsLoading(true)

        try {
            const data = await fetchSlotsForDate(date)
            return data
        } catch (error) {
            logError("Unexpected error fetching daily slots", error, "useAvailability::getSlotsForDate");
            return [];
        } finally {
            setIsLoading(false)
        }
    }, []);


    const deleteSlots = useCallback(async (date: string) => {
        if (!userId) {
            logError("Attempted to delete slots without User ID", undefined, "useAvailability::deleteSlots");
            toast.error("Authentication error. Please log in again.");
            return;
        }
        try {
            await deleteSlotsForDate(userId, date)
        } catch (error) {
            logError("Error executing delete slots", error, "useAvailability::deleteSlots");
        }
    }, [userId]);


    const insertSlots = useCallback(async (slotsToInsert: Omit<AvailabilityDB, "id" | "duration">[]) => {
        try {
            const { error } = await supabase.from('availability').insert(slotsToInsert);
            if (error) {
                logError("Error inserting slots", error, "useAvailability::insertSlots");
                toast.error("Could not save your schedule. Please try again.");
            }
        } catch (error) {
            logError("Unexpected error inserting slots", error, "useAvailability::insertSlots");
        }
    }, []);


    const getSlotsByDoctorIdForDate = useCallback(async (doctorId: string, date: string, location_id: string): Promise<AvailabilityDB[]> => {
        try {
            return await fetchRawAvailability(doctorId, date, location_id);
        } catch (error) {
            logError("Error in getSlotsByDoctorIdForDate", error, "useAvailability::getSlotsByDoctorIdForDate");
            return [];
        }
    }, []);


    const lockAvailabilitySlot = useCallback(async (selectedSlotId: string) => {
        try {
            await markSlotAsBooked(selectedSlotId)
        } catch (error) {
            logError("Error locking slot", error, "useAvailability::lockAvailabilitySlot");
        }
    }, [])


    const getOccupiedDates = useCallback(async (startDate: string, endDate: string): Promise<Set<string>> => {
        if (!userId) return new Set();
        setIsLoading(true);

        try {
            return await getDatesWithSlotFromDateRange(userId, startDate, endDate);
        } catch (error) {
            logError("Error fetching occupied dates", error, "useAvailability::getOccupiedDates");
            return new Set();
        } finally {
            setIsLoading(false);
        }
    }, [userId])

    return {
        getSlotsForDate,
        deleteSlots,
        insertSlots,
        getSlotsByDoctorIdForDate,
        lockAvailabilitySlot,
        getOccupiedDates,
        isLoading
    }
}



const fetchSlotsForDate = async (date: string) => {
    const { data: slotsData, error } = await supabase
        .from('availability')
        .select('*')
        .gte('start_time', `${date}T00:00:00`)
        .lte('start_time', `${date}T23:59:59`)
        .order('start_time', { ascending: true });

    if (error) {
        logError("Supabase error fetching slots", error, "fetchSlotsForDate");
        toast.error("Could not load slots for this date.");
        return [];
    }

    if (slotsData) {
        const formattedSlots = slotsData.map(slot => ({
            id: slot.id,
            start_time: format(new Date(slot.start_time), 'HH:mm'),
            end_time: format(new Date(slot.end_time), 'HH:mm'),
            location_id: slot.location_id,
            duration: slot.duration,
            is_booked: slot.is_booked,
            is_new: false,
        }));
        return formattedSlots
    }
    return []
};


const deleteSlotsForDate = async (userId: string, date: string) => {
    const dateObj = parseISO(date);

    const dayStartISO = startOfDay(dateObj).toISOString();
    const dayEndISO = endOfDay(dateObj).toISOString();

    const { error } = await supabase.from('availability')
        .delete()
        .eq('doctor_id', userId)
        .gte('start_time', dayStartISO)
        .lte('start_time', dayEndISO)
        .eq('is_booked', false);

    if (error) {
        logError("Supabase error deleting slots", error, "useAvailability::deleteSlotsForDate");
        toast.error("Could not clear previous schedule.");
    }
}

const fetchRawAvailability = async (doctorId: string, date: string, location_id: string): Promise<AvailabilityDB[]> => {
    if (!doctorId || !date) return [];

    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    const nowISO = new Date().toISOString();

    const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('location_id', location_id)
        .eq('is_booked', false)
        .gte('start_time', nowISO)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true });

    if (error) {
        logError("Error fetching doctor availability", error, "useAvailability::fetchRawAvailability");
        toast.error("Could not load doctor's schedule.");
        return [];
    }

    return data as AvailabilityDB[];
};

const markSlotAsBooked = async (selectedSlotId: string) => {
    const { error } = await supabase
        .from('availability')
        .update({ is_booked: true })
        .eq('id', selectedSlotId)

    if (error) {
        logError("Error locking appointment slot", error, "useAvailability::markSlotAsBooked");
        toast.error("Could not reserve this time slot. It may already be taken.");
    }
};


const getDatesWithSlotFromDateRange = async (userId: string, startDate: string, endDate: string): Promise<Set<string>> => {
    const { data, error } = await supabase
        .from('availability')
        .select('start_time')
        .eq('doctor_id', userId)
        .eq('is_booked', true)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`);

    if (error) {
        logError("Error checking availability", error, "useAvailability::getDatesWithSlotFromDateRange");
        toast.error("Could not load availability.");
    }

    if (data) {
        return new Set(
            data.map(slot => new Date(slot.start_time).toISOString().split('T')[0])
        );
    }
    return new Set()
}

