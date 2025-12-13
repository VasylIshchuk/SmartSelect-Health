import { useCallback, useState } from "react";
import { Doctor } from "./../types/Doctor";
import { DOCTORS } from "@/data/dashboard-data";

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);

  const addDoctor = useCallback((newDoctor: Doctor) => {
    setDoctors((prev) => [...prev, newDoctor]);
  }, []);

  const deleteDoctor = useCallback((doctorId: string) => {
    setDoctors((prev) => prev.filter((d) => d!.id !== doctorId));
  }, []);
  return { addDoctor, deleteDoctor, doctors };
};
