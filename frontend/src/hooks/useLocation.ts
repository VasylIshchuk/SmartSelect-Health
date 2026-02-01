import { supabase } from "@/api/supabase";
import { useCallback } from "react";


export type Location = {
    id: string;
    name: string;
    address: string;
    city: string;
};


export const useLocation = (userId: string | undefined) => {

    const insertLocation = useCallback(async (newLocation: Omit<Location, 'id'>): Promise<Location> => {
        if (!userId) throw new Error("User ID is missing. Cannot create location.");

        const { data, error } = await supabase.from('locations').insert({
            ...newLocation
        }).select().single();

        if (error) throw new Error(`Insert new location Error: ${error}`);
        return data as Location
    }, [userId]);

    const getLocationsByQueryOrSpecialization = useCallback(async (
        specialization?: string,
        userQueryInput?: string
    ): Promise<Location[]> => {
        try {
            return await fetchLocations(specialization, userQueryInput)
        } catch (error) {
            return [];
        }
    }, [userId]);

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

    if (error) throw new Error(`Error fetching locations: ${error.message}`);

    const uniqueLocationsMap = new Map();

    data.forEach((item: any) => {
        if (!uniqueLocationsMap.has(item.id)) {
            const { availability, ...locationData } = item;
            uniqueLocationsMap.set(item.id, locationData);
        }
    });

    return Array.from(uniqueLocationsMap.values()) as Location[];
}