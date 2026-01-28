import { FormDataState } from "@/types/book_appointment";
import { useEffect, useState } from "react";
import { Doctor, useDoctor } from "../useDoctor";
import { AvailabilityDB, useAvailability } from "../useAvailability";
import { useAppointment } from "../useAppointments";

export function useAppointmentData(formData: FormDataState, userId?: string) {
    const { getDoctors, getUniqueSpecializations } = useDoctor(userId);
    const { getSlotsByDoctorIdForDate } = useAvailability(userId);
    const { bookAppointment } = useAppointment(userId)

    const [specializations, setSpecializations] = useState<string[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [slots, setSlots] = useState<AvailabilityDB[]>([]);


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
                const data = await getSlotsByDoctorIdForDate(
                    formData.doctorId,
                    formData.selectedDate,
                    formData.locationId
                );
                if (isMounted) setSlots(data);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [getSlotsByDoctorIdForDate, formData.doctorId, formData.selectedDate, formData.locationId]);

    return { specializations, doctors, slots, bookAppointment };
}

