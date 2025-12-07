"use client";

import LoginScreen from "@/components/auth/LoginScreen";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import PatientDashboard from "@/components/dashboards/patient/PatientDashboard";
import { mockAccounts } from "@/data/mock-accounts";
import type { Account } from "@/types/account";
import { useMemo, useState, type FormEvent } from "react";

export default function Home() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [activeUser, setActiveUser] = useState<Account | null>(null);
  const [error, setError] = useState("");

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const match = mockAccounts.find(
      (account) =>
        account.email.toLowerCase() === form.email.trim().toLowerCase() &&
        account.password === form.password.trim()
    );

    if (!match) {
      setError(
        "Nieprawidłowy email lub hasło. Użyj danych z sekcji testowych kont."
      );
      return;
    }

    setActiveUser(match);
    setError("");
  };

  const handleLogout = () => {
    setActiveUser(null);
    setForm({ email: "", password: "" });
  };

  const dashboard = useMemo(() => {
    if (!activeUser) return null;

    switch (activeUser.role) {
      case "patient":
        return <PatientDashboard user={activeUser} onLogout={handleLogout} />;
      case "doctor":
        return <DoctorDashboard user={activeUser} onLogout={handleLogout} />;
      default:
        return <AdminDashboard user={activeUser} onLogout={handleLogout} />;
    }
  }, [activeUser]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10">
      {!activeUser ? (
        <LoginScreen
          accounts={mockAccounts}
          email={form.email}
          password={form.password}
          error={error}
          onFieldChange={(field, value) => {
            setForm((prev) => ({ ...prev, [field]: value }));
          }}
          onSubmit={handleLogin}
        />
      ) : (
        dashboard
      )}
    </main>
  );
}
