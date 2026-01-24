import { FormDataState } from "@/types/book_appointment";
import { AiReportData } from "@/types/report";
import { useEffect, useMemo, useState } from "react";

export function useAppointmentForm(user: any) {
    const [formData, setFormData] = useState<FormDataState>({
        firstName: '', lastName: '', pesel: '', birthDate: '',
        reportedSymptoms: '', visitType: 'Consultation', specialization: '',
        locationId: '', doctorId: '', selectedDate: '', selectedTimeSlot: null,
    });
    const [aiReport, setAiReport] = useState<AiReportData | null>(null);
    const [locationQuery, setLocationQuery] = useState('');

    const updateField = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const isFormComplete = useMemo(() => {
        return Object.values(formData).every(val => val !== '' && val !== null);
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
            } catch (e) { console.error("Error parsing report", e); }
        }
    }, []);

    useEffect(() => {
        if (user?.user_metadata) {
            const { first_name, last_name, pesel, date_of_birth } = user.user_metadata;
            setFormData(prev => ({
                ...prev,
                firstName: first_name || '',
                lastName: last_name || '',
                pesel: pesel || '',
                birthDate: date_of_birth || '',
            }));
        }
    }, [user]);

    return { formData, setFormData, updateField, isFormComplete, aiReport, locationQuery, setLocationQuery };
}
