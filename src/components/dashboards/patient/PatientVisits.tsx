import { patientAppointments } from "@/data/dashboard-data";
import { ArrowLeft, Calendar, Clock, MapPin, User } from "lucide-react";

type Visit = typeof patientAppointments.upcoming[0];

type Props = {
  onBack: () => void;
};

export default function PatientVisits({ onBack }: Props) {
  const visits = patientAppointments.upcoming;

  return (
    <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <VisitsHeader onBack={onBack} />

      <div className="flex flex-col gap-4">
        {visits.length > 0 ? (
          visits.map((visit, index) => (
            <VisitCard key={`${visit.doctor}-${index}`} visit={visit} />
          ))
        ) : (
          <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
            You currently have no scheduled appointments
          </div>
        )}
      </div>
    </section>
  );
}

const VisitsHeader = ({ onBack }: { onBack: () => void }) => (
  <div className="flex items-center gap-4 mb-8">
    <button
      onClick={onBack}
      className="inline-flex items-center justify-center rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-blue-600"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
    <div>
      <h3 className="text-2xl font-semibold text-slate-900">My Appointments</h3>
      <p className="text-sm text-slate-500">
        Upcoming and Scheduled Consultations
      </p>
    </div>
  </div>
);


const VisitCard = ({ visit }: { visit: Visit }) => (
  <div className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-blue-100 hover:shadow-md">

    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <User className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{visit.doctor}</p>
          <p className="text-sm text-slate-500">{visit.specialization}</p>
        </div>
      </div>
      <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
        {visit.status}
      </span>
    </div>

    <hr className="my-5 border-slate-100" />

    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock className="h-4 w-4 text-slate-400" />
        <span>
          {visit.time} <span className="text-slate-400">({visit.duration})</span>
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Calendar className="h-4 w-4 text-slate-400" />
        <span>{visit.date}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="h-4 w-4 text-slate-400" />
        <span>{visit.location}</span>
      </div>
    </div>
  </div>
);


