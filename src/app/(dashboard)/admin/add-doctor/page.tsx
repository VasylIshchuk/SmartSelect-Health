"use client";
import { AddDoctor } from "@/components/shared/AddDoctor";
import { useRouter } from "next/navigation";

export default function AddDoctorPage() {
  const router = useRouter();

  return (
    <AddDoctor
      onBack={() => {
        router.refresh();
        router.push("/admin");
      }}
      onCancel={() => router.push("/admin")}
    />
  );
}
