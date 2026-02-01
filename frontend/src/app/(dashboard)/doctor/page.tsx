"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardStats, useDoctor } from "@/hooks/useDoctor";
import { useSession } from "@/components/hoc/AuthSessionProvider";
import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/shared/DashboardHeader";
import { doctorPortalData } from "@/data/dashboard-data";
import { QuickActionsList } from "@/components/shared/QuickActionsList";
import { DoctorAppointmentList } from "@/components/dashboards/doctor/DoctorAppointmentList";


export default function DoctorPage() {
    const router = useRouter();

    const handleManageAvailability = (view: string) => {
        router.push(`/doctor/${view}`);
    };

    const { session } = useSession();
    const { getStats } = useDoctor(session?.user?.id);

    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            const statsData = await getStats();
            if (isMounted && statsData) setStats(statsData);
        };

        loadData();
        return () => { isMounted = false; };
    }, [session, getStats]);


    const statsList = useMemo(() => [
        {
            label: "Consultations Today",
            value: stats?.todayAppointments ?? 0,
        },
        {
            label: "Consultations with AI Report",
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

            <QuickActionsList
                actions={doctorPortalData.quickActions}
                onNavigate={handleManageAvailability}
            />

            <div className="grid gap-6">
                <ScheduleSection />
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

const ScheduleSection = () => {
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
                    <p className="text-sm text-slate-500">Consultations Calendar</p>
                    <h3 className="text-2xl font-semibold text-slate-900">{formattedDate}</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full shrink-0 bg-slate-50">
                    <CalendarDays className="h-5 w-5 text-slate-400 " />
                </div>
            </div>

            <DoctorAppointmentList filter={'today'} />
        </section>
    );
};
