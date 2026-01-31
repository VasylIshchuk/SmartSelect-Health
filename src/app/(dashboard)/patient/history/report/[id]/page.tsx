"use client"

import { ReportView } from "@/components/shared/ReportView";
import { useParams } from "next/navigation";

export default function PatientReportPage() {
    const params = useParams();
    const appointmentId = params.id as string;

    return <ReportView appointmentId={appointmentId} />;
}
