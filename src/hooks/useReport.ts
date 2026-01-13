import { useCallback } from "react";
import { supabase } from "@/api/supabase";


export type ReportDetails = {
    appointmentId: string;
    symptoms: string;
    doctor_final_diagnosis: string | null;
    patient: {
        firstName: string;
        lastName: string;
        pesel: string;
        age: number;
    };
    doctor: {
        firstName: string;
        lastName: string;
    };
    details: {
        confidence: number;
        recommended_specializations: string[];
        duration: string | null;
        suggestion: string;
        summary: string;
        doctor_feedback_ai_rating: string | null;
    } | null;
};

export const useReport = (userId: string | undefined) => {
    const getReportDetails = useCallback(async (appointmentId: string): Promise<ReportDetails | null> => {
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
): Promise<ReportDetails | null> => {

    const { data, error } = await supabase
        .from("appointments")
        .select(`
                id,
                symptoms,
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
                    ai_suggestion,
                    ai_summary,
                    doctor_feedback_ai_rating
                ),
                doctor_final_diagnosis
        `)
        .eq("id", appointmentId)
        .single();

    if (error) {
        console.error("Error fetching raport details:", error);
        return null;
    }

    if (!data) return null;

    return formatReport(data)
};

const formatReport = (data: any): ReportDetails => {
    const patientData = Array.isArray(data.patient) ? data.patient[0] : data.patient;
    const reportData = Array.isArray(data.report) ? data.report[0] : data.report;

    const doctorLink = Array.isArray(data.doctor_link) ? data.doctor_link[0] : data.doctor_link;
    const doctorProfile = Array.isArray(doctorLink.profiles) ? doctorLink.profiles[0] : doctorLink.profiles

    return {
        appointmentId: data.id,
        symptoms: data.symptoms,
        doctor_final_diagnosis: data.doctor_final_diagnosis,
        patient: {
            firstName: patientData?.first_name,
            lastName: patientData?.last_name,
            pesel: patientData?.pesel,
            age: calculateAge(patientData?.date_of_birth),
        },
        doctor: {
            firstName: doctorProfile.first_name,
            lastName: doctorProfile.last_name,
        },
        details: reportData
            ? {
                confidence: reportData.ai_confidence_score,
                recommended_specializations: reportData.ai_recommended_specializations,
                duration: reportData.sickness_duration,
                suggestion: reportData.ai_suggestion,
                summary: reportData.ai_summary,
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