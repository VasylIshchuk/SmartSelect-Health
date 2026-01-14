"use client";
import { UpdateDoctor } from "@/components/shared/UpdateDoctor";
import { useAdmin } from "@/hooks/useAdmin";
import { useEffect, useState } from "react";
import { use } from "react";

type DoctorWithProfile = {
  id: string;
  specialization: string | null;
  work_start_date: string | null;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
  };
};

export default function UpdateDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getDoctorById, isLoading } = useAdmin();
  const [doctor, setDoctor] = useState<DoctorWithProfile | null>(null);

  useEffect(() => {
    async function fetchDoctor() {
      const doc = await getDoctorById(id);
      setDoctor(doc);
    }
    fetchDoctor();
  }, [id, getDoctorById]);

  return <UpdateDoctor doctor={doctor} isLoading={isLoading || !doctor} />;
}
