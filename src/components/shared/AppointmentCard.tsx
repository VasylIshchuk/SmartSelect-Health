import { Calendar, Clock, LucideIcon, MapPin, User } from "lucide-react";
import { Appointment } from "@/hooks/useAppointments";
import { ReactNode } from "react";

type AppointmentCardProps = {
    appointment: Appointment;
    actionSlot?: ReactNode;
    onCardClick?: () => void;
};

export const AppointmentCard = ({ appointment, actionSlot, onCardClick }: AppointmentCardProps) => {
    return (
        <div className="group relative rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:border-blue-100 hover:shadow-md transition-all">
            {onCardClick && (
                <div
                    onClick={onCardClick}
                    className="absolute inset-0 z-0 cursor-pointer rounded-3xl"
                    aria-hidden="true"
                />
            )}
            <div className="relative z-10 pointer-events-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="flex flex-1 items-center gap-4 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <User className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg font-semibold text-slate-900">
                                {appointment.firstName} {appointment.lastName}
                            </p>

                            {appointment.specialization && (
                                <p className="text-sm text-slate-500">{appointment.specialization}</p>
                            )}
                        </div>

                        <span className={`ml-auto shrink-0 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {actionSlot && (
                        <div className="mt-1 pointer-events-auto">
                            {actionSlot}
                        </div>
                    )}
                </div>


                {(appointment.reportedSymptoms || appointment.hasAiReport) && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                            {appointment.hasAiReport && (
                                <span className="inline-flex shrink-0 items-center rounded-full w-fit bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                                    AI Report
                                </span>
                            )}
                        </div>

                        {appointment.reportedSymptoms && (
                            <p className="text-sm text-slate-600 line-clamp-2">
                                <span className="font-semibold text-slate-700">Symptoms: </span>
                                {appointment.reportedSymptoms}
                            </p>
                        )}
                    </div>
                )}

                <hr className="my-5 border-slate-100" />

                <div className="grid gap-4 sm:grid-cols-3">
                    <InfoItem
                        icon={Clock}
                        text={appointment.time}
                        subText={`${appointment.duration} min`}
                    />
                    <InfoItem
                        icon={Calendar}
                        text={appointment.date}
                    />
                    <InfoItem
                        icon={MapPin}
                        text={appointment.location}
                    />
                </div>
            </div>
        </div>
    );
};


const getStatusColor = (status: string) => {
    if (['Confirmed', 'Finished'].includes(status)) return 'bg-emerald-50 text-emerald-600';
    if (status === 'Cancelled') return 'bg-red-50 text-red-600';
    return 'bg-amber-50 text-amber-600';
};


const InfoItem = ({ icon: Icon, text, subText }: { icon: LucideIcon, text: string, subText?: string }) => (
    <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">
            {text} {subText && <span className="text-slate-400">({subText})</span>}
        </span>
    </div>
);