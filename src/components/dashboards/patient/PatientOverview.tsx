import { patientPortalData } from "@/data/dashboard-data";
import {
  CalendarDays,
  Clock,
  LogOut,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { PatientView } from "./PatientDashboard";
import { Account } from "@/types/account";
import DashboardHeader from "../DashboardHeader";

type PatientOverviewProps = {
  user: Account;
  onNavigate: (view: PatientView) => void;
};

export default function PatientOverview({
  user,
  onNavigate,
}: PatientOverviewProps) {
  const quickActions = patientPortalData.quickActions;
  const visitHighlight = patientPortalData.upcomingHighlight;

  return (
    <div className="space-y-6">
      <DashboardHeader user={user} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AiAssistantCard onStart={() => onNavigate("interview")} />

        <QuickActionsList actions={quickActions} onNavigate={onNavigate} />
      </div>

      <UpcomingVisitCard visit={visitHighlight} />
    </div>
  );
}

const AiAssistantCard = ({ onStart }: { onStart: () => void }) => (
  <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          AI Medical Assistant
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">
          Begin a New Consultation
        </h3>
        <p className="mt-3 max-w-xl text-sm text-slate-600">
          {patientPortalData.interviewCopy}
        </p>
      </div>
      <Sparkles className="h-10 w-10 text-blue-400" />
    </div>
    <button
      onClick={onStart}
      className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 font-medium text-blue-600 transition hover:border-blue-300"
    >
      <MessageSquare className="h-4 w-4" />
      Begin a New Consultation
    </button>
  </div>
);

const QuickActionsList = ({
  actions,
  onNavigate,
}: {
  actions: typeof patientPortalData.quickActions;
  onNavigate: (view: PatientView) => void;
}) => (
  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <p className="text-sm font-semibold text-slate-500">Quick Actions</p>
    <div className="mt-4 space-y-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onNavigate(action.targetView as PatientView)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
        >
          <p className="text-sm font-semibold text-slate-900">{action.label}</p>
          <p className="text-xs text-slate-500">{action.description}</p>
        </button>
      ))}
    </div>
  </div>
);

const UpcomingVisitCard = ({
  visit,
}: {
  visit: typeof patientPortalData.upcomingHighlight;
}) => (
  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-center justify-between">
      <p className="text-lg font-semibold text-slate-900">
        Upcoming Appointment
      </p>
      <CalendarDays className="h-5 w-5 text-slate-400" />
    </div>

    <div className="mt-6 rounded-3xl border border-slate-100 p-5">
      <p className="text-base font-semibold text-slate-900">{visit.doctor}</p>
      <p className="text-sm text-slate-500">{visit.specialization}</p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          {visit.time}
        </span>
        <span>{visit.date}</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          {visit.status}
        </span>
      </div>
    </div>
  </section>
);
