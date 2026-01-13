"use client"

import { AppointmentList } from "@/components/shared/AppointmentList";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useRouter } from "next/navigation";

export default function PatientVisits() {
  const router = useRouter();

  return (
    <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="My Appointments"
        subtitle="Upcoming and Scheduled Consultations"
        onBack={() => router.back()}
      />
      <div className="mt-4">
        <AppointmentList appointmentsFilter={'all'} />
      </div>
    </section>
  );
}





