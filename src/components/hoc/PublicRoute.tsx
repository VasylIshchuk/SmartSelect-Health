"use client";

import { useSession } from "@/components/hoc/AuthSessionProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

type PublicRouteProps = {
  children: React.ReactNode;
};

const roleRoutes: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
};

export default function PublicRoute({ children }: PublicRouteProps) {
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && session.role) {
      const correctRoute = roleRoutes[session.role] || "/login";
      router.replace(correctRoute);
    }
  }, [session, router]);

  if (session && session.role) {
    return <LoadingSpinner message="Redirecting to dashboard..." />;
  }

  return <>{children}</>;
}
