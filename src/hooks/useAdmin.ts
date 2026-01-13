import { useCallback } from "react";
import { supabaseAdmin } from "@/api/supabaseAdmin";
import { supabase } from "@/api/supabase";
export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  work_start_date: string;
  password: string;
}

export interface DoctorInsertData {
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  work_start_date: string;
  password: string;
}

export const useAdmin = () => {
  const addDoctor = useCallback(async (newDoctor: DoctorInsertData) => {
    try {
      const { data: user } = await supabaseAdmin.auth.admin.createUser({
        email: newDoctor.email,
        password: newDoctor.password,
        email_confirm: true,

        user_metadata: {
          first_name: newDoctor.first_name,
          last_name: newDoctor.last_name,
        },
      });
      await supabase.from("profiles").insert({
        id: user.user?.id,
        first_name: newDoctor.first_name,
        last_name: newDoctor.last_name,
        role: "doctor",
      });
      await supabase.from("doctors").insert([
        {
          id: user.user?.id,
          specialization: newDoctor.specialization,
          work_start_date: newDoctor.work_start_date,
        },
      ]);
      alert("Doctor successfully added!");
    } catch (error) {
      alert(`Error creating doctor: ${error}`);
      return;
    }
  }, []);

  const deleteDoctor = useCallback(async (doctorId: string) => {
    const { error: doctorError } = await supabaseAdmin
      .from("doctors")
      .delete()
      .eq("id", doctorId);

    console.log(
      "Trying to delete doctor from doctors",
      doctorId,
      "error: ",
      doctorError
    );
    const { error: userError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", doctorId);
    console.log(
      "Trying to delete doctor from users",
      doctorId,
      "error: ",
      userError
    );

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      doctorId
    );

    if (doctorError || userError || authError) {
      alert(`Failed to delete doctor. Please try again. Doctor ID ${doctorId}`);
    }
  }, []);

  const getDoctors = useCallback(async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "doctor");

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];
      const mappedIds = profiles.map((p) => p.id);
      const { data: doctors } = await supabase
        .from("doctors")
        .select("*")
        .in("id", mappedIds);
      const { data: authDoctors } = await supabaseAdmin.auth.admin.listUsers();

      const merged: Doctor[] = profiles.map((profile) => {
        const doctorInfo = doctors?.find((d) => d.id === profile.id);
        const user = authDoctors?.users.find((u) => u.id === profile.id);
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: user!.email!,
          password: user!.user_metadata!.password || "",
          specialization: doctorInfo?.specialization || null,
          work_start_date: doctorInfo?.work_start_date.toString(),
        };
      });

      return merged;
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      return [];
    }
  }, []);

  const getReportStatus = useCallback(
    async ({ reportId }: { reportId: string }) => {
      try {
        const { data } = await supabase
          .from("reports")
          .select("status")
          .eq("id", reportId)
          .single();
        return data?.status;
      } catch (e) {
        throw e;
      }
    },
    []
  );
  return { addDoctor, deleteDoctor, getDoctors, getReportStatus };
};
