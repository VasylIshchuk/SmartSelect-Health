import { useCallback } from "react";
import { supabase } from "@/api/supabase";
import { SummaryReportDetails } from "@/types/report";


export const useReport = (userId: string | undefined) => {
    const getReportDetails = useCallback(async (appointmentId: string): Promise<SummaryReportDetails | null> => {
        try {
            const data = await fetchReportDetails(appointmentId);
            return data;
        } catch (error) {
            console.error("Error fetching report:", error);
            return null;
        }
    }, [userId]);

    return { getReportDetails };
};


export const fetchReportDetails = async (
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
                    ai_diagnosis_suggestion,
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
                ai_diagnosis_suggestion: reportData.ai_diagnosis_suggestion,
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