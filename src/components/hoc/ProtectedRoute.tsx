"use client";

import { useSession } from "@/components/hoc/AuthSessionProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Role } from "@/types/account";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRole: Role;
};

const roleRoutes: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
};

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.role && session.role !== allowedRole) {
      const correctRoute = roleRoutes[session.role] || "/login";
      router.replace(correctRoute);
    }
  }, [session, allowedRole, router]);

  if (!session) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (session.role !== allowedRole) {
    return <LoadingSpinner message="Redirecting to your dashboard..." />;
  }

  return <>{children}</>;
}
