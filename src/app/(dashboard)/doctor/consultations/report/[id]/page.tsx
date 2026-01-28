"use client"

import { ReportView } from "@/components/dashboards/ReportView";
import { useParams } from "next/navigation";

export default function DoctorReportPage() {
    const params = useParams();
    const appointmentId = params.id as string;

    return <ReportView appointmentId={appointmentId} />;
}

