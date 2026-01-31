"use client"

import { useRouter } from "next/navigation";
import { ReportDetailsCard } from "../shared/ReportDetailsCard";
import { SectionHeader } from "../shared/SectionHeader";


export const ReportView = ({ appointmentId }: { appointmentId: string }) => {
    const router = useRouter();

    return (
        <section className="w-full space-y-8">
            <SectionHeader
                title="Report Details"
                subtitle="Patient information, doctor and AI analysis summary"
                onBack={() => router.back()}
            />

            <ReportDetailsCard appointmentId={appointmentId} />
        </section>
    );
};