"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/hoc/AuthSessionProvider";
import { useDoctor } from "@/hooks/useDoctor";
import { ReportDetailsCard } from "@/components/shared/ReportDetailsCard";


type AiRatingType = "accurate" | "inaccurate" | null;


export default function VisitPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [diagnosis, setDiagnosis] = useState("");
  const [aiRating, setAiRating] = useState<AiRatingType>(null);
  const [hasAiReport, setHasAiReport] = useState<boolean>(false)

  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { session } = useSession();
  const { completeVisit, getIsReport } = useDoctor(session?.user?.id);

  const handleSave = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const success = await completeVisit({
        appointmentId: appointmentId,
        diagnosis: diagnosis,
        aiRating: aiRating
      });

      if (success) {
        setSavedMessage("The appointment has been saved");
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        setErrorMessage("Failed to save the visit. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const hasReport = await getIsReport(appointmentId);
        if (isMounted) setHasAiReport(hasReport);
      } catch (error) {
        console.error("Failed to check AI report status", error);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [appointmentId, getIsReport]);


  return (
    <section className="w-full space-y-8">
      <SectionHeader
        title="Appointment Details"
        subtitle="Patient information and AI analysis summary"
        onBack={() => router.back()}
      />

      <ReportDetailsCard appointmentId={appointmentId} />

      <DiagnosisFormCard
        diagnosis={diagnosis}
        setDiagnosis={setDiagnosis}
        aiRating={aiRating}
        setAiRating={setAiRating}
        onSave={handleSave}
        savedMessage={savedMessage}
        errorMessage={errorMessage}
        hasAiReport={hasAiReport}
        isSubmitting={isSubmitting}
      />
    </section>
  );
}




type DiagnosisFormCardProps = {
  diagnosis: string;
  setDiagnosis: (val: string) => void;
  aiRating: AiRatingType;
  setAiRating: (val: AiRatingType) => void;
  onSave: () => void;
  savedMessage: string;
  errorMessage: string;
  hasAiReport: boolean;
  isSubmitting: boolean;
};

const DiagnosisFormCard = ({
  diagnosis,
  setDiagnosis,
  aiRating,
  setAiRating,
  onSave,
  savedMessage,
  errorMessage,
  hasAiReport,
  isSubmitting,
}: DiagnosisFormCardProps) => {

  const isDiagnosisFilled = diagnosis.trim().length > 0;

  const isAiValidationSatisfied = hasAiReport ? aiRating !== null : true;

  const isSaveEnabled = isDiagnosisFilled && isAiValidationSatisfied && !isSubmitting;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Appointment Documentation
          </h3>
          <p className="text-sm text-slate-500">
            Medical summary & AI validation
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="ml-1 block font-semibold text-slate-700"
          htmlFor="diagnosis"
        >
          Final Diagnosis
        </label>
        <textarea
          id="diagnosis"
          rows={6}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Type the final diagnosis here..."
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      {hasAiReport && (
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="mb-3 text-center text-sm font-medium text-slate-600 sm:text-left">
            How accurate was the AI suggestion?
          </p>
          <div className="flex gap-3">
            <AiRatingButton
              type="accurate"
              currentRating={aiRating}
              onClick={() => setAiRating("accurate")}
            />
            <AiRatingButton
              type="inaccurate"
              currentRating={aiRating}
              onClick={() => setAiRating("inaccurate")}
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={!isSaveEnabled}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md transition-all 
                    ${isSaveEnabled
            ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]'
            : 'bg-slate-400 cursor-not-allowed opacity-50 shadow-none'
          }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving Appointment...
          </>
        ) : savedMessage ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            {savedMessage}
          </>
        ) : (
          <>
            <ClipboardCheck className="h-5 w-5" />
            Save and End Appointment
          </>
        )}
      </button>
    </section>
  );
};

const AiRatingButton = ({
  type,
  currentRating,
  onClick,
}: {
  type: "accurate" | "inaccurate";
  currentRating: AiRatingType;
  onClick: () => void;
}) => {
  const isAccurate = type === "accurate";
  const isActive = currentRating === type;

  const baseClasses =
    "group flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all duration-200";

  const activeClasses = isAccurate
    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
    : "border-rose-500 bg-rose-50 text-rose-700 shadow-sm";

  const inactiveClasses = isAccurate
    ? "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 hover:shadow-sm"
    : "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-700 hover:shadow-sm";

  const Icon = isAccurate ? ThumbsUp : ThumbsDown;
  const iconRotateClass = isAccurate
    ? "group-hover:-rotate-12"
    : "group-hover:rotate-12";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <Icon
        className={`h-4 w-4 transition-transform ${iconRotateClass} ${isActive ? "fill-current" : ""}`}
      />
      {isAccurate ? "Accurate" : "Inaccurate"}
    </button>
  );
};

