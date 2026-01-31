"use client";

import PublicRoute from "@/components/hoc/PublicRoute";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicRoute>{children}</PublicRoute>;
}
