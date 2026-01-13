"use client";

import PatientInterview from "@/components/dashboards/patient/PatientInterview"; 
import { useRouter } from "next/navigation";

export default function InterviewPage() {
  const router = useRouter();

  return (
    <div className="flex-1 w-full">
      <PatientInterview 
        onBack={() => router.back()} 
      />
    </div>
  );
}