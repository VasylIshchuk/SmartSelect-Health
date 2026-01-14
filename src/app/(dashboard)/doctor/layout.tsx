"use client";

import ProtectedRoute from "@/components/hoc/ProtectedRoute";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRole="doctor">{children}</ProtectedRoute>;
}
