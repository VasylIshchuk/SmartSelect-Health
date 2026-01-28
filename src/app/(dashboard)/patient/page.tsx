"use client"

import { patientPortalData } from "@/data/dashboard-data";
import { CalendarDays, MessageSquare, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboards/DashboardHeader";
import { QuickActionsList } from "@/components/dashboards/QuickActionsList";
import { PatientAppointmentList } from "@/components/dashboards/PatientAppointmentList";


export default function PatientPage() {
  const router = useRouter();

  const handleNavigate = (view: string) => {
    router.push(`/patient/${view}`);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AiAssistantCard onStart={() => router.push("/patient/interview")} />

        <QuickActionsList
          actions={patientPortalData.quickActions}
          onNavigate={handleNavigate}
        />
      </div>

      <UpcomingAppointmentCards />
    </div>
  );
}

const AiAssistantCard = ({ onStart }: { onStart: () => void }) => {
  if (!patientPortalData.aiCard) return
  const { label, title, description, buttonText } = patientPortalData.aiCard;

  return (
    <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {label}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">
            {title}
          </h3>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            {description}
          </p>
        </div>
        <Sparkles className="h-10 w-10 text-blue-400" />
      </div>
      <button
        onClick={onStart}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 font-medium text-blue-600 transition hover:border-blue-300"
      >
        <MessageSquare className="h-4 w-4" />
        {buttonText}
      </button>
    </div>
  )
};


const UpcomingAppointmentCards = () => (
  <section className="">
    <div className="flex items-center justify-between p-4">
      <p className="text-lg font-semibold text-slate-900">
        Upcoming Appointment
      </p>
      <CalendarDays className="h-5 w-5 text-slate-400" />
    </div>

    <PatientAppointmentList filter={'upcoming'} />
  </section>
)
