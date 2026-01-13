"use client"

import { ReportDetailsCard } from "@/components/shared/ReportDetailsCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useParams, useRouter } from "next/navigation";

export default function ReportPage() {
    const params = useParams();
    const appointmentId = params.id as string;

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
}

