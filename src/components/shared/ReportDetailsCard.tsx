"use client";

import { ClipboardClock, Sparkles, Star, Stethoscope } from "lucide-react";
import InfoBadge from "./InfoBadge";
import { useSession } from "../hoc/AuthSessionProvider";
import { useEffect, useState } from "react";
import { ReportDetails, useReport } from "@/hooks/useReport";

export const ReportDetailsCard = ({ appointmentId }: { appointmentId: string }) => {
    const { session } = useSession();
    const { getReportDetails } = useReport(session?.user?.id);

    const [reportDetails, setReportDetails] = useState<ReportDetails | null>(null);
    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            const data = await getReportDetails(appointmentId);
            if (isMounted) setReportDetails(data);
        };

        loadData();
        return () => { isMounted = false; };
    }, [getReportDetails]);

    if (!reportDetails) {
        return (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                No loading appointment details
            </div>
        )
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
                <InfoBadge label="Full Name" value={`${reportDetails.patient.firstName} ${reportDetails.patient.lastName}`} />
                <InfoBadge label="Age" value={reportDetails.patient.age} />
                <InfoBadge label="PESEL" value={reportDetails.patient.pesel} />
            </div>

            <ReportSummary reportDetails={reportDetails} />
        </section>
    );
};


const ReportSummary = ({ reportDetails }: { reportDetails: ReportDetails }) => {
    const { details, doctor, doctor_final_diagnosis, symptoms } = reportDetails;

    const hasDoctorDiagnosis = !!doctor_final_diagnosis;
    const hasAiRating = details?.doctor_feedback_ai_rating !== null && details?.doctor_feedback_ai_rating !== undefined;

    return (
        <div className="space-y-6">
            {details ? (
                <div className="rounded-3xl border border-purple-100 bg-linear-to-br from-purple-50 to-white p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-purple-700">
                                AI Preliminary Report
                            </p>
                            <p className="text-xs text-slate-500">
                                Confidence: {Math.round((details.confidence ?? 0) * 100)}%
                            </p>
                        </div>
                        <Sparkles className="h-5 w-5 text-purple-400" />
                    </div>

                    <dl className="mt-4 space-y-3 text-sm text-slate-700">
                        <div>
                            <dt className="font-semibold text-slate-900">Reported Symptoms</dt>
                            <dd>{symptoms}</dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-slate-900">Duration</dt>
                            <dd>{details.duration}</dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-slate-900">Summary</dt>
                            <dd>{details.summary}</dd>
                        </div>
                    </dl>

                    <div className="mt-6 space-y-3">
                        <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-purple-100">
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-500">
                                AI Diagnosis Suggestion
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-800 leading-relaxed">
                                {details.suggestion}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-purple-100">
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-500">
                                Recommended Specialization
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {details.recommended_specializations.map((specialization: string) => (
                                    <span
                                        key={specialization}
                                        className="rounded-full border border-purple-100 bg-white px-4 py-1 text-xs font-medium text-purple-900"
                                    >
                                        {specialization}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="grid gap-1 text-sm pl-4 text-slate-600">
                        <div className="font-semibold text-slate-900">Reported Symptoms</div>
                        <div>{reportDetails.symptoms}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                        No AI report available for this appointment.
                    </div>
                </div>
            )}

            {hasDoctorDiagnosis && (
                <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-700">
                                Doctor's Verification
                            </p>
                            <p className="text-xs text-slate-500">
                                Reviewed by {doctor?.firstName} {doctor?.lastName}
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

        </div>
    );
};
