"use client";

import ProtectedRoute from "@/components/hoc/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRole="admin">{children}</ProtectedRoute>;
}
