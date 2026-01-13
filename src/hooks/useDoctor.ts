import { useCallback } from "react";
import { supabase } from "@/api/supabase";



export type DoctorAppointment = {
    id: string;
    time: string;
    duration: string;
    type: string;
    patientName: string;
    symptoms: string;
    hasAiReport: boolean;
};

export type DashboardStats = {
    todayAppointments: number;
    totalPatients: number;
    aiReports: number;
};

export type VisitCompletionData = {
    appointmentId: string;
    diagnosis: string;
    aiRating: 'accurate' | 'inaccurate' | null;
};



export const useDoctor = (userId: string | undefined) => {

    const getUpcomingAppointments = useCallback(async (): Promise<DoctorAppointment[]> => {
        if (!userId) return [];

        try {
            const data = await fetchTodayAppointments(userId);
            return data;
        } catch (error) {
            return [];
        }
    }, [userId]);

    const getStats = useCallback(async (): Promise<DashboardStats | null> => {
        if (!userId) return null;

        try {
            const [todayCount, patientsCount, aiAppointments] =
                await Promise.all([
                    fetchTodayAppointmentsCount(userId),
                    fetchCountPatients(userId),
                    fetchAppointmentsWithAI(userId),
                ]);

            return {
                todayAppointments: todayCount,
                totalPatients: patientsCount,
                aiReports: aiAppointments,
            };
        } catch (error) {
            console.error("Error fetching doctor stats:", error);
            return null;
        }
    }, [userId]);

    const completeVisit = useCallback(async (data: VisitCompletionData): Promise<boolean> => {
        try {
            await saveDoctorDiagnosis(data);
            return true;
        } catch (error) {
            console.error("Error saving diagnosis:", error);
            return false;
        }
    }, []);

    const getIsReport = useCallback(async (appointmentId: string): Promise<boolean> => {
        try {
            return await checkReportExists(appointmentId);
        } catch (error) {
            return false;
        }
    }, []);

    return {
        getUpcomingAppointments,
        getStats,
        completeVisit,
        getIsReport
    };
};

const getTodayRangeISO = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return {
        todayStartIso: start.toISOString(),
        todayEndIso: end.toISOString()
    };
};



const fetchTodayAppointmentsCount = async (doctorId: string) => {
    const { todayStartIso, todayEndIso } = getTodayRangeISO();

    const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .gte("scheduled_time", todayStartIso)
        .lte("scheduled_time", todayEndIso);

    if (error) console.error('Error today appointments:', error);

    return count ?? 0;
};

const fetchCountPatients = async (doctorId: string) => {
    const { data, error } = await supabase.rpc("count_unique_patients", {
        doc_id: doctorId,
    });

    if (error) console.error('Error AI appointments:', error);

    return (data as number) ?? 0;
};

const fetchAppointmentsWithAI = async (doctorId: string) => {
    const { count, error } = await supabase
        .from("appointments")
        .select("reports!inner(id)", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .not("reports.ai_suggestion", "is", null);

    if (error) console.error('Error counting patients:', error);

    return count ?? 0;
};



const fetchTodayAppointments = async (
    doctorId: string
): Promise<DoctorAppointment[]> => {
    const { todayStartIso, todayEndIso } = getTodayRangeISO();

    const { data, error } = await supabase
        .from("appointments")
        .select(`
                id,
                scheduled_time,
                duration,
                visit_type,
                symptoms, 
                profiles!patient_id (first_name, last_name),
                reports (ai_suggestion)
        `)
        .eq("doctor_id", doctorId)
        .gte("scheduled_time", todayStartIso)
        .lte("scheduled_time", todayEndIso)
        .order("scheduled_time", { ascending: true });

    if (error) {
        console.error('Error getting today appointments:', error);
        return [];
    }

    return data.map(formatTodayAppointment);
};

const formatTodayAppointment = (item: any): DoctorAppointment => {
    const hasAiReport = !!(item.reports && item.reports.ai_suggestion);
    const patient = Array.isArray(item.profiles)
        ? item.profiles[0]
        : item.profiles;

    const dateObj = new Date(item.scheduled_time);

    return {
        id: item.id,
        time: dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        }),
        duration: item.duration,
        type: item.visit_type,
        patientName: `${patient.first_name} ${patient.last_name}`,
        symptoms: item.symptoms,
        hasAiReport: hasAiReport,
    };
}



const saveDoctorDiagnosis = async ({ appointmentId, diagnosis, aiRating }: VisitCompletionData) => {
    const { error: appointmentError } = await supabase
        .from("appointments")
        .update({
            status: "Finished",
            doctor_final_diagnosis: diagnosis,
        })
        .eq("id", appointmentId);

    if (appointmentError) throw appointmentError;


    const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select("report_id")
        .eq("id", appointmentId)
        .single();

    if (fetchError) {
        throw new Error("No report associated with the visit was found");
    }


    if (appointment?.report_id) {
        const { error: reportError } = await supabase
            .from("reports")
            .update({
                doctor_feedback_ai_rating: aiRating,
                status: "Completed"
            })
            .eq("id", appointment.report_id);

        if (reportError) throw reportError;
    }

};

const checkReportExists = async (appointmentId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('appointments')
        .select('report_id')
        .eq('id', appointmentId)
        .maybeSingle();

    if (error || !data) {
        console.error('Report checking error:', error);
        return false;
    }

    return !!data.report_id;
};