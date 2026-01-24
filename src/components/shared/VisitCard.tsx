import { Appointment } from "@/hooks/usePatient";
import { Calendar, Clock, MapPin, User } from "lucide-react";


export const VisitCard = ({ appointment }: { appointment: Appointment }) => (
    <div className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-blue-100 hover:shadow-md">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <User className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-lg font-semibold text-slate-900">{appointment.firstName} {appointment.lastName}</p>
                    <p className="text-sm text-slate-500">{appointment.specialization}</p>
                </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                {appointment.status}
            </span>
        </div>

        <hr className="my-5 border-slate-100" />

        <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>
                    {appointment.time} <span className="text-slate-400">({appointment.duration} min)</span>
                </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{appointment.date}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{appointment.location}</span>
            </div>
        </div>
    </div>
);
