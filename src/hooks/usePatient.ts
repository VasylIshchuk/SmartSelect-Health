import { useCallback } from "react";
import { supabase } from "@/api/supabase";

export type Appointment = {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    date: string;
    time: string;
    duration: number;
    status: string;
    location: string;
};

export type ReportItem = {
    id: string;
    appointmentId: string;
    date: string;
    time: string
    reportedSymptoms: string;
    status: string;
}

export const usePatient = (userId: string | undefined) => {
    const getAppointments = useCallback(async (filter: 'all' | 'upcoming'): Promise<Appointment[]> => {
        if (!userId) return [];

        try {
            const appointments = await fetchAppointments(userId, filter);
            return appointments;
        } catch (error) {
            return [];
        }
    }, [userId]);

    const getReports = useCallback(async (): Promise<ReportItem[]> => {
        if (!userId) return [];

        try {
            const reports = await fetchReports(userId);
            return reports;
        } catch (error) {
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
                locations (
                    name,
                    address,
                    city
                ),
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

    if (error) throw new Error(`Error fetching appointments: ${error.message}`);
    if (!data) return [];

    return data.map(formatAppointment);
};

const formatAppointment = (item: any): Appointment => {
    const dateObj = new Date(item.scheduled_time);

    const doctorProfile = Array.isArray(item.doctors?.profiles)
        ? item.doctors.profiles[0]
        : item.doctors?.profiles;

    const locationData = Array.isArray(item.locations)
        ? item.locations[0]
        : item.locations;

    const locationName = locationData
        ? `${locationData.name}, ${locationData.address}, ${locationData.city}`
        : 'Unknown Location';

    return {
        id: item.id,
        firstName: doctorProfile?.first_name || '',
        lastName: doctorProfile?.last_name || '',
        specialization: item.doctors?.specialization || '',

        date: dateObj.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        time: dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        }),

        duration: item.duration,
        status: item.status,
        location: locationName,
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
                    reported_symptoms,
                    scheduled_time,
                    created_at
                )
        `)
        .eq('patient_id', userId)
        .order('created_at', { referencedTable: 'appointments', ascending: false });

    if (error) throw new Error(`Error fetching raports: ${error.message}`);

    if (!reports) return [];

    return reports.map(formatReport);
};

const formatReport = (item: any): ReportItem => {
    const appointment = Array.isArray(item.appointments)
        ? item.appointments[0]
        : item.appointments;

    const dateObj = new Date(appointment?.scheduled_time);

    return {
        id: item.id,
        appointmentId: appointment?.id,
        reportedSymptoms: appointment?.reported_symptoms || 'No data on symptoms',
        date: dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }),
        time: dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        }),
        status: item.status,
    };
};