import { useCallback } from "react";
import { supabase } from "@/api/supabase";


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
            return [];
        }
    }, [userId]);

    const getUniqueSpecializations = useCallback(async (): Promise<string[]> => {
        try {
            return await fetchSpecializations()
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
            return null;
        }
    }, [userId]);

    const completeAppointment = useCallback(async (data: AppointmentCompletionData): Promise<boolean> => {
        try {
            await saveDoctorDiagnosis(data);
            return true;
        } catch (error) {
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

    if (error) throw new Error(`Error fetching doctors: ${error.message}`);


    const uniqueDoctorsMap = new Map();

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
};


const fetchSpecializations = async (): Promise<string[]> => {
    const { data, error } = await supabase
        .from('doctors')
        .select('specialization');

    if (error) {
        throw new Error(`Error fetching specializations: ${error.message}`);
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

    if (error) throw new Error(`Error today appointments: ${error.message}`);

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

    if (error) throw new Error(`Error AI appointments: ${error.message}`);

    return (data as number) ?? 0;
};

const fetchAppointmentsWithAI = async (doctorId: string) => {
    const { count, error } = await supabase
        .from("appointments")
        .select("reports!inner(id)", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .not("reports.ai_primary_diagnosis", "is", null);

    if (error) throw new Error(`Error counting patients: ${error.message}`);

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

    if (appointmentError) throw appointmentError;


    const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select("report_id")
        .eq("id", appointmentId)
        .single();


    if (fetchError) throw new Error(`No report associated with the visit was found: ${fetchError.message}`);

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
