import { useCallback, useState } from "react";
import { supabase } from "@/api/supabase";
import { FormDataState } from "@/types/book_appointment";
import { AiReportData } from "@/types/report";

export type Appointment = {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;

    date: string;
    time: string;
    duration: number;
    availabilityId: string;
    status: string;
    location: string;

    hasAiReport: boolean;
    reportedSymptoms: string;
};

const ROLE_COLUMN_MAP = {
    doctor: 'doctor_id',
    patient: 'patient_id'
} as const;



export const useAppointment = (userId: string | undefined) => {
    const [isLoading, setIsLoading] = useState(false);

    const getAppointmentsDetails = useCallback(async (
        filter: 'all' | 'upcoming' | 'today',
        userRole: "patient" | "doctor"
    ): Promise<Appointment[]> => {
        if (!userId) return [];

        setIsLoading(true);

        try {
            const appointments = await fetchAppointments(userId, filter, userRole);
            return appointments;
        } catch (error) {
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [userId]);


    const confirmAppointment = useCallback(async (appointmetId: string) => {
        try {
            return await markAppointmentConfirmed(appointmetId)
        } catch (error) {
            return false
        }
    }, [userId]);

    const cancelAppointment = useCallback(async (appointmetId: string, availabilityId: string) => {
        try {
            return await markAppointmentCancelled(appointmetId, availabilityId)
        } catch (error) {
            return false
        }
    }, [userId]);

    
    const bookAppointment = useCallback(async (
        formData: FormDataState,
        report: AiReportData | null
    ): Promise<boolean> => {
        if (!userId) return false

        try {
            await submitAppointmentTransaction(userId, formData, report);
            return true
        } catch (error: any) {
            throw new Error(`Booking error: ${error.message}`);
        }
    }, [userId]);

    return { getAppointmentsDetails, confirmAppointment, cancelAppointment, bookAppointment, isLoading }
}


const fetchAppointments = async (
    userId: string,
    filter: 'all' | 'upcoming' | 'today',
    userRole: "patient" | "doctor"
): Promise<Appointment[]> => {
    const filterColumn = ROLE_COLUMN_MAP[userRole];

    let selectQuery = `
        id,
        status,
        visit_type,
        reported_symptoms,
        created_at,
        availability!inner (
            id,
            start_time,
            duration,
            locations ( name, address, city )
        ),
        reports ( ai_diagnosis_suggestion )
    `;

    if (userRole === 'patient') {
        selectQuery += `,
            doctors (
                specialization,
                profiles ( first_name, last_name )
            )
        `;
    } else if (userRole === 'doctor') {
        selectQuery += `,
            patient:profiles!patient_id ( first_name, last_name )
        `;
    }

    let query = supabase
        .from('appointments')
        .select(selectQuery)
        .eq(filterColumn, userId);

    if (userRole === 'doctor') {
        query = query.neq('status', 'Cancelled');
    }

    const now = new Date();

    if (filter === 'upcoming') {
        query = query.gt('availability.start_time', now.toISOString());
        query = query.order('availability(start_time)', { ascending: true });
    } else if (filter === 'today') {
        const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();

        query = query
            .gte('availability.start_time', start)
            .lte('availability.start_time', end);

        query = query.order('availability(start_time)', { ascending: true });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error fetching appointments: ${error.message}`);
    if (!data) return [];

    return data.map((item) => formatAppointment(item, userRole));
};


const formatAppointment = (item: any, userRole: "patient" | "doctor"): Appointment => {
    const availability = Array.isArray(item.availability) ? item.availability[0] : item.availability;
    const dateObj = new Date(availability.start_time);

    let firstName = '';
    let lastName = '';
    let specialization = '';

    if (userRole === 'patient') {
        const docProfile = Array.isArray(item.doctors?.profiles) ? item.doctors.profiles[0] : item.doctors?.profiles;
        firstName = docProfile?.first_name || '';
        lastName = docProfile?.last_name || '';
        specialization = item.doctors?.specialization || '';
    } else {
        const patProfile = Array.isArray(item.patient) ? item.patient[0] : item.patient;
        firstName = patProfile?.first_name || '';
        lastName = patProfile?.last_name || '';
    }

    const locationData = Array.isArray(availability.locations) ? availability.locations[0] : availability.locations;
    const locationName = locationData
        ? `${locationData.name}, ${locationData.address}, ${locationData.city}`
        : 'Online / Unknown';

    const reportData = Array.isArray(item.reports) ? item.reports[0] : item.reports;
    const hasAiReport = !!(reportData && reportData.ai_diagnosis_suggestion);

    return {
        id: item.id,
        firstName,
        lastName,
        specialization,

        date: dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),

        availabilityId: availability.id,
        duration: availability.duration,
        status: item.status,
        location: locationName,

        hasAiReport,
        reportedSymptoms: item.reported_symptoms
    };
};



const markAppointmentConfirmed = async (appointmentId: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'Confirmed' })
        .eq('id', appointmentId);

    if (error) return false;

    return true;
}


const markAppointmentCancelled = async (appointmentId: string, availabilityId: string) => {
    const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'Cancelled' })
        .eq('id', appointmentId);

    if (appointmentError) return false;


    if (availabilityId) {
        const { error: availabilityError } = await supabase
            .from('availability')
            .update({ is_booked: false })
            .eq('id', availabilityId);

        if (availabilityError) throw new Error(`Failed to free up slot: ${availabilityError.message}`);
    }

    return true;
}




export const submitAppointmentTransaction = async (
    userId: string,
    formData: FormDataState,
    report: AiReportData | null
) => {
    await updatePatientProfileIfNeeded(userId, formData);

    let savedReportId = null;

    if (report) {
        savedReportId = await insertReport(userId, report);
    }

    await insertAppointment(userId, formData, savedReportId);

    await markSlotAsBooked(formData.doctorId, formData.selectedSlotTime!);
};


const updatePatientProfileIfNeeded = async (userId: string, formData: FormDataState) => {
    if (!formData.pesel && !formData.birthDate) {
        return;
    }

    const updates: any = {};

    if (formData.pesel) updates.pesel = formData.pesel;
    if (formData.birthDate) updates.date_of_birth = formData.birthDate;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) throw new Error(`Failed to update patient data: ${error.message}`);
};


const insertReport = async (userId: string, report: AiReportData): Promise<string> => {
    const { data, error } = await supabase
        .from('reports')
        .insert({
            patient_id: userId,
            reported_summary: report.reported_summary,
            ai_diagnosis_suggestion: report.ai_diagnosis_suggestion,
            ai_recommended_specializations: report.ai_recommended_specializations,
            ai_confidence_score: report.ai_confidence_score,
            sickness_duration: report.sickness_duration,
            status: 'Sent to doctor'
        })
        .select('id')
        .single();

    if (error) throw new Error(`Failed to save the report: ${error.message}`);
    return data.id;
};


const insertAppointment = async (userId: string, formData: FormDataState, reportId: string | null) => {

    const { error } = await supabase
        .from('appointments')
        .insert({
            patient_id: userId,
            doctor_id: formData.doctorId,
            availability_id: formData.selectedSlotId,
            report_id: reportId,
            visit_type: formData.visitType,
            reported_symptoms: formData.reportedSymptoms,
            status: 'Pending',
        });

    if (error) throw new Error(`Failed to save the appointment data: ${error.message}`);
};


const markSlotAsBooked = async (doctorId: string, timeSlot: string) => {
    const { error } = await supabase
        .from('availability')
        .update({ is_booked: true })
        .eq('doctor_id', doctorId)
        .eq('start_time', timeSlot);

    if (error) throw new Error(`Error locking the selected appointment slot: ${error.message}`);
};

