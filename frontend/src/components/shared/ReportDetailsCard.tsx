"use client";

import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, ClipboardClock, ClipboardList, Sparkles, Stethoscope } from "lucide-react";
import InfoBadge from "./InfoBadge";
import { useSession } from "../hoc/AuthSessionProvider";
import { useEffect, useState } from "react";
import { useReport } from "@/hooks/useReport";
import { AiReportData, SummaryReportDetails } from "@/types/report";
import { Spinner } from "./Spinner";
import { logError } from "@/lib/logger";


export const ReportDetailsCard = ({ appointmentId }: { appointmentId: string }) => {
    const { session } = useSession();
    const { getConsultationDetails, isLoading: hookLoading } = useReport(session?.user?.id);

    const [reportDetails, setReportDetails] = useState<SummaryReportDetails | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setIsPageLoading(true);

                const data = await getConsultationDetails(appointmentId);

                if (isMounted) {
                    setReportDetails(data);
                }
            } catch (error) {
                logError("[Critical] Error loading consultation details", error, "ReportDetailsCard::useEffect/getConsultationDetails");
            } finally {
                if (isMounted) setIsPageLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [getConsultationDetails, appointmentId]);



    if (isPageLoading || hookLoading) {
        return (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                <Spinner />
            </div>
        );
    }

    if (!reportDetails) {
        return (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                No appointment details found.
            </div>
        );
    }

    return (
        <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ClipboardClock className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Report
                    </h2>
                    <p className="text-sm text-slate-500">
                        Review AI and doctor report summary
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                <InfoBadge label="Full Name" value={`${reportDetails.patient.first_name} ${reportDetails.patient.last_name}`} />
                <InfoBadge label="Age" value={reportDetails.patient.age} />
                <InfoBadge label="PESEL" value={reportDetails.patient.pesel} />
            </div>

            <ReportSummary reportDetails={reportDetails} />
        </section>
    );
};


const ReportSummary = ({ reportDetails }: { reportDetails: SummaryReportDetails }) => {
    const { details, reported_symptoms } = reportDetails;

    if (!details) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="grid gap-1 text-sm pl-4 text-slate-600">
                        <div className="font-semibold text-slate-900">Reported Symptoms</div>
                        <div>{reported_symptoms}</div>
                    </div>
                    <NoAiRaport />
                </div>
            </div>
        )
    }

    const aiReportData: AiReportData = {
        ...details,
        reported_symptoms,
    };

    return (
        <div className="space-y-6">
            <AiRaport data={aiReportData} />
            <DoctorRaport reportDetails={reportDetails} />
        </div>
    );
};

const NoAiRaport = () => {
    return (
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            No AI report available for this appointment.
        </div>
    )
}

export const AiRaport = ({ data }: { data: AiReportData }) => {
    const confidencePercent = Math.round((data.ai_confidence_score ?? 0) * 100);
    const confidenceStyle = getConfidenceColor(data.ai_confidence_score ?? 0);

    return (
        <div className="rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50/50 to-white overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-indigo-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                            AI Medical Analysis
                        </h3>
                    </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${confidenceStyle}`}>
                    <Activity className="h-3 w-3" />
                    {confidencePercent}% Confidence
                </div>
            </div>

            <div className="p-6 space-y-6">
                
                {data.ai_critical_warning && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-4 animate-pulse">
                        <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">
                                Critical Warning
                            </p>
                            <p className="text-sm font-semibold text-red-700 mt-1">
                                {data.ai_critical_warning}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-4 rounded-2xl border border-indigo-50">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Symptoms</p>
                        <p className="text-slate-700 font-medium">{data.reported_symptoms}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-50">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Duration</p>
                        <p className="text-slate-700 font-medium">{data.sickness_duration}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden">
                    <div className="bg-indigo-50/50 px-4 py-2 border-b border-indigo-100">
                        <p className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4" />
                            Primary Diagnosis
                        </p>
                    </div>
                    <div className="p-5">
                        <p className="text-lg font-bold text-slate-900 mb-2">
                            {data.ai_primary_diagnosis}
                        </p>
                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                            "{data.ai_diagnosis_reasoning}"
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-2">
                        <ClipboardList className="h-4 w-4" />
                        Recommended Actions
                    </p>
                    <ul className="grid gap-2">
                        {data.ai_suggested_management.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 text-sm text-slate-700">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-2 border-t border-indigo-50">
                    <p className="text-xs text-slate-400 mb-2">Specialists:</p>
                    <div className="flex flex-wrap gap-2">
                        {data.ai_recommended_specializations.map((specialization) => (
                            <span
                                key={specialization}
                                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-100"
                            >
                                {specialization}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100 border-green-200";
    if (score >= 0.5) return "text-amber-600 bg-amber-100 border-amber-200";
    return "text-red-600 bg-red-100 border-red-200";
};


const DoctorRaport = ({ reportDetails }: { reportDetails: SummaryReportDetails }) => {
    const { details, doctor, doctor_final_diagnosis } = reportDetails;

    const hasDoctorDiagnosis = !!doctor_final_diagnosis;
    const hasAiRating = details?.doctor_feedback_ai_rating !== null && details?.doctor_feedback_ai_rating !== undefined;
    return (
        <span>
            {hasDoctorDiagnosis && (
                <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-700">
                                Doctor's Verification
                            </p>
                            <p className="text-xs text-slate-500">
                                Reviewed by {doctor?.first_name} {doctor?.last_name}
                            </p>
                        </div>
                        <div className="rounded-full bg-blue-100 p-1.5">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-blue-100 backdrop-blur-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                Final Diagnosis
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800 leading-relaxed">
                                {doctor_final_diagnosis}
                            </p>
                        </div>

                        {hasAiRating && details && (
                            <div className="flex items-center justify-between rounded-2xl bg-blue-600 p-4 text-white shadow-md shadow-blue-200">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-blue-100 opacity-90">
                                        AI Accuracy Rating
                                    </p>
                                    <p className="text-xs text-blue-100 mt-0.5">
                                        Evaluated by specialist
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold capitalize shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                    {details.doctor_feedback_ai_rating}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </span>
    )
}
