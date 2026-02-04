import { FormDataState } from "@/types/book_appointment";
import { AiReportData } from "@/types/report";
import { useEffect, useMemo, useState } from "react";
import { UserProfile } from "../useUser";
import { logError } from "@/lib/logger";

export function useAppointmentForm(user: UserProfile | null) {
    const [formData, setFormData] = useState<FormDataState>({
        firstName: '', lastName: '', pesel: '', birthDate: '',
        reportedSymptoms: '', visitType: 'Consultation', specialization: '',
        locationId: '', doctorId: '', selectedDate: '', selectedSlotId: null, selectedSlotTime: null,
    });
    const [aiReport, setAiReport] = useState<AiReportData | null>(null);
    const [locationQuery, setLocationQuery] = useState('');

    const updateField = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const isFormComplete = useMemo(() => {
        return (
            formData.firstName.trim() !== '' &&
            formData.lastName.trim() !== '' &&
            formData.pesel.trim() !== '' &&
            formData.birthDate.trim() !== '' &&
            formData.reportedSymptoms.trim() !== '' &&
            formData.doctorId !== '' &&
            formData.selectedDate !== '' &&
            formData.selectedSlotId !== null &&
            formData.selectedSlotId !== ''
        );
    }, [formData]);


    useEffect(() => {
        const savedReport = localStorage.getItem('medicalReport');
        if (savedReport) {
            try {
                const parsed = JSON.parse(savedReport);
                setAiReport(parsed);
                setFormData(prev => ({
                    ...prev,
                    reportedSymptoms: parsed.reported_symptoms || prev.reportedSymptoms
                }));
            } catch (error) {
               logError("Error parsing saved medical report from LocalStorage", error, "AppointmentForm::useEffect");
               localStorage.removeItem('medicalReport');
            }
        }
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                pesel: user.pesel || '',
                birthDate: user.date_of_birth || '',
            }));
        }
    }, [user]);

    return { formData, setFormData, updateField, isFormComplete, aiReport, locationQuery, setLocationQuery };
}
