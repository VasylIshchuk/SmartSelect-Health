import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AiReportData, ReportHistoryItem, SummaryReportDetails } from "@/types/report";
import { logError } from "@/lib/logger";
import { toast } from "sonner";


export const useReport = (userId: string | undefined) => {
    const [isLoading, setIsLoading] = useState(false);

    const getConsultationDetails = useCallback(async (appointmentId: string): Promise<SummaryReportDetails | null> => {
        setIsLoading(true);
        try {
            const data = await fetchConsultationDetails(appointmentId);
            return data;
        } catch (error) {
            logError("Unexpected error in getConsultationDetails", error, "useReport::getConsultationDetails");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getReportsHistory = useCallback(async (): Promise<ReportHistoryItem[]> => {
        if (!userId) return [];

        setIsLoading(true);

        try {
            const reports = await fetchPatientReports(userId);
            return reports;
        } catch (error) {
            logError("Unexpected error in getReportsHistory", error, "useReport::getReportsHistory");
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const getIsReport = useCallback(async (appointmentId: string): Promise<boolean> => {
        try {
            return await checkReportExists(appointmentId);
        } catch (error) {
            logError("Unexpected error in getIsReport", error, "useReport::getIsReport");
            return false;
        }
    }, []);

    const createAiReport = useCallback(async (report: AiReportData): Promise<string | null> => {
        if (!userId) {
            logError("Attempted to create report without User ID", undefined, "useReport::createAiReport");
            toast.error("Authentication error. Please log in again.");
            return null;
        }
        try {
            return await insertReport(userId, report);
        } catch (error) {
            logError("Unexpected error in createAiReport", error, "useReport::createAiReport");
            return null;
        }
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

    if (error) {
        logError("Supabase error fetching consultation details", error, "fetchConsultationDetails");
        toast.error("Could not load consultation details.");
        return null;
    }

    if (!data) {
        return null;
    }

    try {
        return formatReport(data);
    } catch (formatError) {
        logError("Data formatting error", formatError, "fetchConsultationDetails/formatReport");
        return null;
    }
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

    if (error) {
        logError("Supabase error fetching patient reports", error, "useReport::fetchPatientReports");
        toast.error("Could not load report history.");
        return [];
    }

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

    if (error) {
        logError("Supabase error checking report existence", error, "useReport::checkReportExists");
        return false;
    }

    if (!data) return false

    return !!data.report_id;
};


const insertReport = async (userId: string, report: AiReportData): Promise<string | null> => {
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

    if (error) {
        logError("Supabase error inserting new report", error, "useReport::insertReport");
        toast.error("Could not save the report. Please try again.");
        return null;
    }

    return data.id;
};