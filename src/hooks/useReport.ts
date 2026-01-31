import { useCallback, useState } from "react";
import { supabase } from "@/api/supabase";
import { AiReportData, ReportHistoryItem, SummaryReportDetails } from "@/types/report";


export const useReport = (userId: string | undefined) => {
    const [isLoading, setIsLoading] = useState(false);

    const getConsultationDetails = useCallback(async (appointmentId: string): Promise<SummaryReportDetails | null> => {
        setIsLoading(true);
        try {
            const data = await fetchConsultationDetails(appointmentId);
            return data;
        } catch (error) {
            console.error("Error fetching report:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const getReportsHistory = useCallback(async (): Promise<ReportHistoryItem[]> => {
        if (!userId) return [];

        setIsLoading(true);

        try {
            const reports = await fetchPatientReports(userId);
            return reports;
        } catch (error) {
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const getIsReport = useCallback(async (appointmentId: string): Promise<boolean> => {
        try {
            return await checkReportExists(appointmentId);
        } catch (error) {
            return false;
        }
    }, []);

    const createAiReport = useCallback(async (report: AiReportData): Promise<string> => {
        if (!userId) throw new Error("User ID is missing. Cannot delete slots."); 
        return await insertReport(userId, report);
    }, [userId]);

    return { getConsultationDetails, getReportsHistory, getIsReport, createAiReport, isLoading };
};


export const fetchConsultationDetails = async (
    appointmentId: string
): Promise<SummaryReportDetails | null> => {

    const { data, error } = await supabase
        .from("appointments")
        .select(`
                id,
                reported_symptoms,
                patient:profiles!patient_id (
                    first_name,
                    last_name,
                    pesel,
                    date_of_birth
                ),
                doctor_link:doctors!doctor_id (
                    profiles (
                        first_name,
                        last_name
                    )
                ),
                report:reports!report_id (
                    ai_confidence_score,
                    ai_recommended_specializations,
                    sickness_duration,
                    ai_primary_diagnosis,
                    ai_diagnosis_reasoning,
                    ai_suggested_management,
                    ai_critical_warning,
                    reported_summary,
                    doctor_feedback_ai_rating
                ),
                doctor_final_diagnosis
        `)
        .eq("id", appointmentId)
        .single();

    if (error) throw new Error(`Error fetching raport details: ${error.message}`);
    if (!data) return null;

    return formatReport(data)
};

const formatReport = (data: any): SummaryReportDetails => {
    const patientData = Array.isArray(data.patient) ? data.patient[0] : data.patient;
    const reportData = Array.isArray(data.report) ? data.report[0] : data.report;

    const doctorLink = Array.isArray(data.doctor_link) ? data.doctor_link[0] : data.doctor_link;
    const doctorProfile = Array.isArray(doctorLink.profiles) ? doctorLink.profiles[0] : doctorLink.profiles

    return {
        appointment_id: data.id,
        reported_symptoms: data.reported_symptoms,
        doctor_final_diagnosis: data.doctor_final_diagnosis,
        patient: {
            first_name: patientData?.first_name,
            last_name: patientData?.last_name,
            pesel: patientData?.pesel,
            age: calculateAge(patientData?.date_of_birth),
        },
        doctor: {
            first_name: doctorProfile.first_name,
            last_name: doctorProfile.last_name,
        },
        details: reportData
            ? {
                ai_confidence_score: reportData.ai_confidence_score,
                ai_recommended_specializations: reportData.ai_recommended_specializations,
                sickness_duration: reportData.sickness_duration,

                ai_primary_diagnosis: reportData.ai_primary_diagnosis,
                ai_diagnosis_reasoning: reportData.ai_diagnosis_reasoning,
                ai_suggested_management: reportData.ai_suggested_management,
                ai_critical_warning: reportData.ai_critical_warning,

                reported_summary: reportData.reported_summary,
                doctor_feedback_ai_rating: reportData.doctor_feedback_ai_rating,
            }
            : null,
    };
}

const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};






export const fetchPatientReports = async (userId: string) => {
    const { data: reports, error } = await supabase
        .from('reports')
        .select(`
                id, 
                status,
                created_at,
                appointments (
                    id,
                    reported_symptoms,
                    created_at,
                    availability (
                        start_time
                    )
                )
        `)
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Error fetching raports: ${error.message}`);

    if (!reports) return [];

    return reports.map(formatPatientReport);
};

const formatPatientReport = (item: any): ReportHistoryItem => {
    const appointment = Array.isArray(item.appointments)
        ? item.appointments[0]
        : item.appointments;

    const availability = Array.isArray(appointment?.availability)
        ? appointment.availability[0]
        : appointment?.availability;

    const dateStr = availability?.start_time
    const dateObj = new Date(dateStr);

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



const checkReportExists = async (appointmentId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('appointments')
        .select('report_id')
        .eq('id', appointmentId)
        .maybeSingle();

    if (error) throw new Error(`Report checking error: ${error.message}`);

    if (!data) return false

    return !!data.report_id;
};


const insertReport = async (userId: string, report: AiReportData): Promise<string> => {
    const { reported_symptoms, ...reportDataForDb } = report;
    const { data, error } = await supabase
        .from('reports')
        .insert({
            patient_id: userId,
            ...reportDataForDb,
            status: 'Sent to doctor'
        })
        .select('id')
        .single();

    if (error) throw new Error(`Failed to save the report: ${error.message}`);
    return data.id;
};