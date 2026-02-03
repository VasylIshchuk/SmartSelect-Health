import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logError, logWarning } from "@/lib/logger";
import { toast } from "sonner";


export type DashboardStats = {
    todayAppointments: number;
    totalPatients: number;
    aiReports: number;
};

export type AppointmentCompletionData = {
    appointmentId: string;
    diagnosis: string;
    aiRating: 'accurate' | 'inaccurate' | null;
};

export type Doctor = {
    id: string;
    specialization: string;
    profiles: {
        first_name: string;
        last_name: string;
    };
};




export const useDoctor = (userId: string | undefined) => {
    const getDoctors = useCallback(async (locationId: string, specialization?: string): Promise<Doctor[]> => {
        try {
            return await fetchDoctors(locationId, specialization)
        } catch (error) {
            logError("Unexpected error in getDoctors hook", error, "useDoctor::getDoctors");
            return [];
        }
    }, []);

    const getUniqueSpecializations = useCallback(async (): Promise<string[]> => {
        try {
            return await fetchSpecializations()
        } catch (error) {
            logError("Unexpected error in getUniqueSpecializations", error, "useDoctor::getUniqueSpecializations");
            return [];
        }
    }, []);

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
            logError("Error loading dashboard stats", error, "useDoctor::getStats");
            toast.error("Could not load dashboard statistics.");
            return null;
        }
    }, [userId]);

    const completeAppointment = useCallback(async (data: AppointmentCompletionData): Promise<boolean> => {
        try {
            await saveDoctorDiagnosis(data);
            return true;
        } catch (error) {
            logError("Unexpected error completing appointment", error, "useDoctor::completeAppointment");
            return false;
        }
    }, []);


    return {
        getStats,
        completeAppointment,
        getDoctors,
        getUniqueSpecializations,
    };
};



export const fetchDoctors = async (locationId: string, specialization?: string): Promise<Doctor[]> => {
    if (!locationId) return [];

    let queryBuilder = supabase
        .from('doctors')
        .select(`
            id,
            specialization,
            profiles!inner (
                first_name,
                last_name
            ),
            availability!inner (
                location_id
            )
        `)
        .eq('availability.location_id', locationId);

    if (specialization) {
        queryBuilder = queryBuilder.eq('specialization', specialization);
    }

    const { data, error } = await queryBuilder;


    if (error) {
        logError("Supabase error fetching doctors", error, "useDoctors::fetchDoctors");
        return [];
    }

    const uniqueDoctorsMap = new Map();

    try {
        data.forEach((doctor: any) => {
            if (!uniqueDoctorsMap.has(doctor.id)) {
                uniqueDoctorsMap.set(doctor.id, {
                    id: doctor.id,
                    specialization: doctor.specialization,
                    profiles: Array.isArray(doctor.profiles) ? doctor.profiles[0] : doctor.profiles
                });
            }
        });
        return Array.from(uniqueDoctorsMap.values());
    } catch (parseError) {
        logError("Error parsing doctors data", parseError, "useDoctors::fetchDoctors");
        return [];
    }
};


const fetchSpecializations = async (): Promise<string[]> => {
    const { data, error } = await supabase
        .from('doctors')
        .select('specialization');

    if (error) {
        logError("Supabase error fetching specializations", error, "useDoctors::fetchSpecializations");
        return [];
    }

    const allSpecializations = data.map((d: any) => d.specialization).filter(Boolean);
    return Array.from(new Set(allSpecializations));
};





const fetchTodayAppointmentsCount = async (doctorId: string) => {
    const { todayStartIso, todayEndIso } = getTodayRangeISO();

    const { count, error } = await supabase
        .from("appointments")
        .select("availability!inner(start_time)", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .gte("availability.start_time", todayStartIso)
        .lte("availability.start_time", todayEndIso);

    if (error) {
        logError("Error counting today appointments", error, "useDoctors::fetchTodayAppointmentsCount");
        return 0;
    }

    return count ?? 0;
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




const fetchCountPatients = async (doctorId: string) => {
    const { data, error } = await supabase.rpc("count_unique_patients", {
        doc_id: doctorId,
    });

    if (error) {
        logError("Error counting unique patients ", error, "useDoctors::fetchCountPatients");
        return 0;
    }

    return (data as number) ?? 0;
};

const fetchAppointmentsWithAI = async (doctorId: string) => {
    const { count, error } = await supabase
        .from("appointments")
        .select("reports!inner(id)", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .not("reports.ai_primary_diagnosis", "is", null);

    if (error) {
        logError("Error counting AI appointments", error, "useDoctors::fetchAppointmentsWithAI");
        return 0;
    }

    return count ?? 0;
};



const saveDoctorDiagnosis = async ({ appointmentId, diagnosis, aiRating }: AppointmentCompletionData) => {
    const { error: appointmentError } = await supabase
        .from("appointments")
        .update({
            status: "Finished",
            doctor_final_diagnosis: diagnosis,
        })
        .eq("id", appointmentId);

    if (appointmentError) {
        logError("Error updating appointment status", appointmentError, "useDoctors::saveDoctorDiagnosis/updateAppointment");
        return false;
    }


    const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select("report_id")
        .eq("id", appointmentId)
        .single();


    if (fetchError) logError("Could not fetch report_id for appointment", fetchError, "useDoctors::saveDoctorDiagnosis/fetchReportId");

    if (appointment?.report_id) {
        const { error: reportError } = await supabase
            .from("reports")
            .update({
                doctor_feedback_ai_rating: aiRating,
                status: "Completed"
            })
            .eq("id", appointment.report_id);

       if (reportError) {
            logWarning("Error updating AI report feedback (AI rating could not be saved)", "useDoctors::saveDoctorDiagnosis/updateReport");
            toast.warning("Visit finished, but AI rating could not be saved.");
            return true; 
        }
    }

};
