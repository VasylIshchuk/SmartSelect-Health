"use client";

import PublicRoute from "@/components/hoc/PublicRoute";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicRoute>{children}</PublicRoute>;
}
