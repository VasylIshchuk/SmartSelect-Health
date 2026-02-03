import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/logger";
import { useCallback } from "react";
import { toast } from "sonner";


export type Location = {
    id: string;
    name: string;
    address: string;
    city: string;
};


export const useLocation = (userId: string | undefined) => {

    const insertLocation = useCallback(async (newLocation: Omit<Location, 'id'>): Promise<Location | null> => {
        if (!userId) {
            logError("Attempted to create location without User ID", undefined, "useLocation::insertLocation");
            toast.error("Authentication error. Please log in again.");
            return null;
        }

        try {
            const { data, error } = await supabase.from('locations').insert({
                ...newLocation
            }).select().single();

            if (error) {
                logError("Supabase error inserting location", error, "useLocation::insertLocation");
                toast.error("Could not add new location. Please try again.");
                return null;
            }

            toast.success("Location added successfully.");
            return data as Location;

        } catch (error) {
            logError("Unexpected error in insertLocation", error, "useLocation::insertLocation");
            return null;
        }
    }, [userId]);

    const getLocationsByQueryOrSpecialization = useCallback(async (
        specialization?: string,
        userQueryInput?: string
    ): Promise<Location[]> => {
        try {
            return await fetchLocations(specialization, userQueryInput);
        } catch (error) {
            logError("Critical error in location search", error, "useLocation::getLocationsByQueryOrSpecialization");
            return [];
        }
    }, []);

    return { insertLocation, getLocationsByQueryOrSpecialization }
}

const fetchLocations = async (
    specialization?: string,
    query?: string
): Promise<Location[]> => {
    let selectString = 'id, name, address, city';

    if (specialization) {
        selectString += `, availability!inner ( doctors!inner ( specialization ) )`;
    }

    let queryBuilder = supabase.from('locations').select(selectString);

    if (specialization) {
        queryBuilder = queryBuilder.eq('availability.doctors.specialization', specialization);
    }

    if (query && query.length > 0) {
        const safeQuery = query.replace(/,/g, '');
        queryBuilder = queryBuilder.or(`city.ilike.%${safeQuery}%,name.ilike.%${safeQuery}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        logError("Supabase error fetching locations", error, "useLocation::fetchLocations");
        toast.error("Could not load locations.");
        return [];
    }

    if (!data) return [];

    const uniqueLocationsMap = new Map();

   try {
        data.forEach((item: any) => {
            if (!uniqueLocationsMap.has(item.id)) {
                const { availability, ...locationData } = item;
                uniqueLocationsMap.set(item.id, locationData);
            }
        });

        return Array.from(uniqueLocationsMap.values()) as Location[];
    } catch (parseError) {
        logError("Error parsing location data", parseError, "useLocation::fetchLocations");
        return [];
    }
}