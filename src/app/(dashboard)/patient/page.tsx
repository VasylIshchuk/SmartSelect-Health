"use client"

import { patientPortalData } from "@/data/dashboard-data";
import { CalendarDays, MessageSquare, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppointmentList } from "@/components/shared/AppointmentList";
import DashboardHeader from "@/components/dashboards/DashboardHeader";


export default function PatientPage() {
  const router = useRouter();

  const handleNavigate = (view: string) => {
    router.push(`/patient/${view}`);
  };

  const quickActions = patientPortalData.quickActions;

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AiAssistantCard onStart={() => router.push("/patient/interview")} />

        <QuickActionsList
          actions={quickActions}
          onNavigate={handleNavigate}
        />
      </div>

      <UpcomingVisitCards />
    </div>
  );
}

const AiAssistantCard = ({ onStart }: { onStart: () => void }) => {
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

const QuickActionsList = ({
  actions,
  onNavigate,
}: {
  actions: typeof patientPortalData.quickActions;
  onNavigate: (view: string) => void;
}) => (
  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <p className="text-sm font-semibold text-slate-500">Quick Actions</p>
    <div className="mt-4 space-y-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onNavigate(action.targetView)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
        >
          <p className="text-sm font-semibold text-slate-900">{action.label}</p>
          <p className="text-xs text-slate-500">{action.description}</p>
        </button>
      ))}
    </div>
  </div>
);

const UpcomingVisitCards = () => (
  <section className="">
    <div className="flex items-center justify-between p-4">
      <p className="text-lg font-semibold text-slate-900">
        Upcoming Appointment
      </p>
      <CalendarDays className="h-5 w-5 text-slate-400" />
    </div>

    <AppointmentList appointmentsFilter={'upcoming'} />
  </section>
)
