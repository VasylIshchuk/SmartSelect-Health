"use client"

import { PatientAppointmentList } from "@/components/dashboards/patient/PatientAppointmentList";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useRouter } from "next/navigation";

export default function AppointmentsPage() {
  const router = useRouter();

  return (
    <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="My Appointments"
        subtitle="Upcoming and Scheduled Consultations"
        onBack={() => router.back()}
      />
      <div className="mt-4">
        <PatientAppointmentList filter={'all'} />
      </div>
    </section>
  );
}