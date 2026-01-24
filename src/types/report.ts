export type AiReportData = {
    reported_summary: string;
    sickness_duration: string;
    ai_diagnosis_suggestion: string;
    ai_confidence_score: number;
    ai_recommended_specializations: string[];
    reported_symptoms: string;
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
    details: {
        reported_summary: string;
        sickness_duration: string;
        ai_confidence_score: number;
        ai_recommended_specializations: string[];
        ai_diagnosis_suggestion: string;
        doctor_feedback_ai_rating: string | null;
    } | null;
};

