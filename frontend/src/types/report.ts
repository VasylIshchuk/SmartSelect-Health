export type AiReportData = {
    reported_symptoms: string;
    reported_summary: string;
    sickness_duration: string;

    ai_primary_diagnosis: string;
    ai_diagnosis_reasoning: string;
    ai_suggested_management: string[];
    ai_critical_warning: string | null;
    ai_recommended_specializations: string[];

    ai_confidence_score: number;
};

type DbAiDetails = Omit<AiReportData, 'reported_symptoms'> & {
    doctor_feedback_ai_rating: string | null;
};

export type SummaryReportDetails = {
    appointment_id: string;
    reported_symptoms: string;
    doctor_final_diagnosis: string | null;
    patient: {
        first_name: string;
        last_name: string;
        pesel: string;
        age: number;
    };
    doctor: {
        first_name: string;
        last_name: string;
    };
    details: DbAiDetails | null;
};


export type ReportHistoryItem = {
    id: string;
    appointmentId: string;
    date: string;
    time: string
    reportedSymptoms: string;
    status: string;
}
