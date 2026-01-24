import { AvailabilitySlot, Doctor, FormDataState, Location } from "@/types/book_appointment";
import { useEffect, useState } from "react";
import { useBookAppointment } from "./useBookAppointment";

export function useAppointmentData(formData: FormDataState, locationQuery: string, userId?: string) {
    const { getUniqueSpecializations, getLocations, getDoctors, getAvailability, bookAppointment } = useBookAppointment(userId);

    const [specializations, setSpecializations] = useState<string[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);


    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            const data = await getUniqueSpecializations();
            if (isMounted) setSpecializations(data);
        };

        loadData();
        return () => { isMounted = false; };
    }, [getUniqueSpecializations]);


    useEffect(() => {
        let isMounted = true;

        const isLocationSelected = !!formData.locationId;

        if (isLocationSelected) {
            setLocations([]);
            return;
        }

        const loadData = async () => {
            const data = await getLocations(formData?.specialization, locationQuery);
            if (isMounted) setLocations(data);
        };

        loadData();
        return () => { isMounted = false; };
    }, [getLocations, locationQuery, formData.specialization, formData.locationId]);


    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (formData.locationId) {
                const data = await getDoctors(formData.locationId, formData.specialization);
                if (isMounted) setDoctors(data);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [getDoctors, formData.locationId, formData.specialization]);


    useEffect(() => {
        let isMounted = true;


        const loadData = async () => {
            if (formData.selectedDate) {
                const data = await getAvailability(formData.doctorId, formData.selectedDate);
                if (isMounted) setSlots(data);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [getAvailability, formData.doctorId, formData.selectedDate]);

    return { specializations, locations, doctors, slots, bookAppointment };
}

