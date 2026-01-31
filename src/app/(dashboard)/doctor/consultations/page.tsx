"use client"
import { DoctorAppointmentList } from "@/components/dashboards/doctor/DoctorAppointmentList";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useRouter } from "next/navigation";

export default function AppointmentPage(){
    const router = useRouter();
    
      return (
        <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionHeader
            title="Consultations"
            subtitle="Upcoming and Scheduled Consultations"
            onBack={() => router.back()}
          />
          <div className="mt-4">
            <DoctorAppointmentList filter={'all'} />
          </div>
        </section>
      );
}