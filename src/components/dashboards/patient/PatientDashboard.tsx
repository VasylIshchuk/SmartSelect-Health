"use client";

import type { Account } from "@/types/account";
import { useState } from "react";
import PatientInterview from "./PatientInterview";
import PatientOverview from "./PatientOverview";
import PatientVisits from "./PatientVisits";
import PatientHistory from "./PatientHistory";

export type PatientView = "overview" | "interview" | "visits" | "history";

type DashboardProps = {
  user: Account;
  onLogout: () => void;
};

export default function PatientDashboard({
  user = {
    role: "patient",
    email: "kk@gmail.com",
    password: "12d1e11",
    name: "Kyrylo",
    subtitle: "No subtitle",
  },
}: DashboardProps) {
  const [view, setView] = useState<PatientView>("overview");

  return (
    <section className="w-full space-y-8">
      {view === "overview" && (
        <PatientOverview user={user} onNavigate={setView} />
      )}

      {view === "interview" && (
        <PatientInterview onBack={() => setView("overview")} />
      )}

      {view === "visits" && (
        <PatientVisits onBack={() => setView("overview")} />
      )}

      {view === "history" && (
        <PatientHistory onBack={() => setView("overview")} />
      )}
    </section>
  );
}
