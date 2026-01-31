import { FormDataState } from "@/types/book_appointment";
import { useEffect, useState } from "react";
import { Doctor, useDoctor } from "../useDoctor";
import { AvailabilityDB, useAvailability } from "../useAvailability";
import { useAppointment } from "../useAppointments";
import { useReport } from "../useReport";
import { useUser } from "../useUser";
import { AiReportData } from "@/types/report";

export function useAppointmentData(formData: FormDataState, userId?: string) {
    const { getDoctors, getUniqueSpecializations } = useDoctor(userId);
    const { getSlotsByDoctorIdForDate, lockAvailabilitySlot } = useAvailability(userId);
    const { createAppointment } = useAppointment(userId)
    const { createAiReport } = useReport(userId)
    const { updateProfileData } = useUser(userId)

    const [specializations, setSpecializations] = useState<string[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [slots, setSlots] = useState<AvailabilityDB[]>([]);

    const [isBooking, setIsBooking] = useState(false);

    const bookAppointment = async (
        currentFormData: FormDataState, 
        report: AiReportData | null
    ): Promise<boolean> => {
        setIsBooking(true); 

        try {
            await updateProfileData(currentFormData.pesel, currentFormData.birthDate);

            let savedReportId = null;
            if (report) savedReportId = await createAiReport(report);
            
            await createAppointment(currentFormData, savedReportId);

            if (currentFormData.selectedSlotId) await lockAvailabilitySlot(currentFormData.selectedSlotId);
            
            return true; 

        } catch (error) {
            throw new Error(`Booking failed: ${error}`);
        } finally {
            setIsBooking(false); 
        }
    };


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

    return { specializations, doctors, slots, bookAppointment, isBooking };
}




