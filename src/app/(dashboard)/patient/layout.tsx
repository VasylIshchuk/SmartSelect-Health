"use client";

import ProtectedRoute from "@/components/hoc/ProtectedRoute";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRole="patient">{children}</ProtectedRoute>;
}
