import { useCallback } from "react";
import { supabase } from "@/api/supabase";

export type Appointment = {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
    date: string;
    time: string;
    duration: string;
    status: string;
    location: string;
};

export type ReportItem = {
    id: string;
    appointment_id: string;
    date: string;
    time: string
    symptoms: string;
    status: string;
}

export const usePatient = (userId: string | undefined) => {
    const getAppointments = useCallback(async (filter: 'all' | 'upcoming'): Promise<Appointment[]> => {
        if (!userId) return [];

        try {
            const appointments = await fetchAppointments(userId, filter);
            return appointments;
        } catch (error) {
            console.error("Error fetching patient appointments:", error);
            return [];
        }
    }, [userId]);

    const getReports = useCallback(async (): Promise<ReportItem[]> => {
        if (!userId) return [];

        try {
            const reports = await fetchReports(userId);
            return reports;
        } catch (error) {
            console.error("Error fetching patient raports:", error);
            return [];
        }
    }, [userId]);
    return { getAppointments, getReports }
};


const fetchAppointments = async (userId: string, filter: 'all' | 'upcoming') => {
    let query = supabase
        .from('appointments')
        .select(`
                id,
                scheduled_time,
                duration,
                status,
                office_location,
                doctors (
                    specialization,
                    profiles ( first_name, last_name )
                )
        `)
        .eq('patient_id', userId)
        .order('scheduled_time', { ascending: true });

    if (filter === 'upcoming') {
        const now = new Date().toISOString();
        query = query.gt('scheduled_time', now);
    }

    const { data, error } = await query;

    if (error || !data) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return data.map(formatAppointment);
};

const formatAppointment = (item: any): Appointment => {
    const dateObj = new Date(item.scheduled_time);

    const doctorProfile = Array.isArray(item.doctors?.profiles)
        ? item.doctors.profiles[0]
        : item.doctors?.profiles;

    return {
        id: item.id,
        first_name: doctorProfile?.first_name || '',
        last_name: doctorProfile?.last_name || '',
        specialization: item.doctors?.specialization || '',

        date: dateObj.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        time: dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        }),

        duration: item.duration,
        status: item.status,
        location: item.office_location,
    };
};


export const fetchReports = async (userId: string) => {
    const { data: reports, error } = await supabase
        .from('reports')
        .select(`
                id, 
                status,
                appointments (
                    id,
                    symptoms,
                    scheduled_time
                )
        `)
        .eq('patient_id', userId)
        .order('scheduled_time', { referencedTable: 'appointments', ascending: false });

    if (error || !reports) {
        console.error('Error fetching raports:', error);
        return [];
    }

    return reports.map(formatReport);
};

const formatReport = (item: any): ReportItem => {
    const appointment = Array.isArray(item.appointments)
        ? item.appointments[0]
        : item.appointments;

    const dateObj = new Date(appointment?.scheduled_time);

    return {
        id: item.id,
        appointment_id: appointment?.id,
        symptoms: appointment?.symptoms || 'No data on symptoms',
        date: dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }),
        time: dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        }),
        status: item.status,
    };
};