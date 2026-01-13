"use client";

import DashboardHeader from "../DashboardHeader";
import {
    CalendarDays,
    Clock,
    User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardStats, DoctorAppointment, useDoctor } from "@/hooks/useDoctor";
import { useSession } from "@/components/hoc/AuthSessionProvider";
import { useEffect, useMemo, useState } from "react";


export default function DoctorOverview() {
    const router = useRouter();

    const { session } = useSession();
    const { getUpcomingAppointments, getStats } = useDoctor(session?.user?.id);

    const [schedule, setSchedule] = useState<DoctorAppointment[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            const appointmentsData = await getUpcomingAppointments();
            const statsData = await getStats();

            if (isMounted) {
                setSchedule(appointmentsData);
                if (statsData) setStats(statsData);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [session, getUpcomingAppointments, getStats]);

    const handleVisitInteraction = (visitId: string) => {
        router.push(`/doctor/visit/${visitId}`);
    };

    const statsList = useMemo(() => [
        {
            label: "Appointments Today",
            value: stats?.todayAppointments ?? 0,
        },
        {
            label: "Appointments with AI Report",
            value: stats?.aiReports ?? 0,
        },
        {
            label: "Total Patients",
            value: stats?.totalPatients ?? 0,
        },
    ], [stats]);

    return (
        <section className="w-full space-y-8">
            <DashboardHeader />

            <StatsGrid stats={statsList} />

            <div className="grid gap-6">
                <ScheduleSection
                    schedule={schedule}
                    onVisitClick={handleVisitInteraction}
                />
            </div>
        </section>
    );
}


type StatItem = {
    label: string;
    value: number;
};

const StatsGrid = ({ stats }: { stats: StatItem[] }) => (
    <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
    </div>
);

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-3 text-4xl font-semibold text-slate-900">{value}</p>
    </div>
);

const ScheduleSection = ({
    schedule,
    onVisitClick,
}: {
    schedule: DoctorAppointment[];
    onVisitClick: (id: string) => void;
}) => {
    const [formattedDate, setFormattedDate] = useState<string>("");

    useEffect(() => {
        setFormattedDate(new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }));
    }, []);

    return (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">Appointment Calendar</p>
                    <h3 className="text-2xl font-semibold text-slate-900">{formattedDate}</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full shrink-0 bg-slate-50">
                    <CalendarDays className="h-5 w-5 text-slate-400 " />
                </div>
            </div>

            {schedule.length > 0 ? (
                <div className="mt-6 space-y-4">
                    {schedule.map((visit) => (
                        <AppointmentCard
                            key={visit.id}
                            visit={visit}
                            onClick={() => onVisitClick(visit.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                    No appointments scheduled for today
                </div>
            )}
        </section>
    );
};

const AppointmentCard = ({
    visit,
    onClick
}: {
    visit: DoctorAppointment;
    onClick: () => void;
}) => {
    return (
        <button
            onClick={onClick}
            className="group w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm"
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200/50 group-hover:text-blue-700 transition-colors">
                        <User className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                        <p className="line-clamp-1 break-all font-semibold text-slate-900">
                            {visit.patientName}
                        </p>
                        <p className="text-sm text-slate-500">{visit.type}</p>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                        <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1 group-hover:bg-white/50">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-900">{visit.time}</span>
                        </div>
                        <span className="text-slate-500">{visit.duration}</span>
                    </div>
                </div>

                {visit.hasAiReport && (
                    <span className="inline-flex shrink-0 items-center rounded-full w-fit bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                        AI Report
                    </span>
                )}
                <p className="line-clamp-1 break-all text-sm text-slate-500">
                    {visit.symptoms}
                </p>
            </div>
        </button>
    );
};
