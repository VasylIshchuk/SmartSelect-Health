import { useCallback, useState } from "react";
import { supabaseAdmin, isAdminApiAvailable } from "@/api/supabaseAdmin";
import { supabase } from "@/api/supabase";
import { toast } from "sonner";
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
  const [isLoading, setIsLoading] = useState(false);
  const addDoctor = useCallback(async (newDoctor: DoctorInsertData) => {
    try {
      setIsLoading(true);
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
      toast.success("Doctor successfully added!");
    } catch (error) {
      toast.error(`Error creating doctor: ${error}`);
      console.error("Error creating doctor:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDoctor = useCallback(async (doctorId: string) => {
    try {
      setIsLoading(true);
      await supabaseAdmin.from("doctors").delete().eq("id", doctorId);

      await supabaseAdmin.from("profiles").delete().eq("id", doctorId);

      await supabaseAdmin.auth.admin.deleteUser(doctorId);
      toast.success("Doctor deleted successfully");
    } catch (error) {
      toast.error(`Error deleting doctor with ID ${doctorId}`);
      console.error("Error deleting doctor:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDoctors = useCallback(async (searchQuery: string = "") => {
    try {
      setIsLoading(true);
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

      let authDoctors = null;
      let authError = null;
      let useAdminApi = false;

      if (isAdminApiAvailable()) {
        useAdminApi = true;
        try {
          const result = await supabaseAdmin.auth.admin.listUsers();
          authDoctors = result.data;
          authError = result.error;

          if (authError) {
            const errorMessage =
              typeof authError === "object" && "message" in authError
                ? String(authError.message)
                : "";
            const statusCode =
              typeof authError === "object" && "status" in authError
                ? Number(authError.status)
                : null;

            if (
              statusCode === 401 ||
              errorMessage.includes("Invalid API key") ||
              errorMessage.includes("401")
            ) {
              console.error("Service Role Key Authentication Failed (401)");
              useAdminApi = false;
            } else {
              console.error("Admin API error:", authError);
              useAdminApi = false;
            }
          }
        } catch (error) {
          console.error("Error calling admin API:", error);
          authError = error as { message?: string; status?: number };
          useAdminApi = false;
        }
      }

      if (!useAdminApi || authError) {
        const result = profiles.map((profile) => {
          const doctorInfo = doctors?.find((d) => d.id === profile.id);
          return {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: "",
            password: "",
            specialization: doctorInfo?.specialization || null,
            work_start_date: doctorInfo?.work_start_date?.toString() || "",
          };
        });

        let filtered = result;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered = result.filter(
            (doctor) =>
              doctor.first_name?.toLowerCase().includes(query) ||
              doctor.last_name?.toLowerCase().includes(query) ||
              `${doctor.first_name} ${doctor.last_name}`
                .toLowerCase()
                .includes(query) ||
              doctor.specialization?.toLowerCase().includes(query)
          );
          filtered.sort((a, b) => {
            const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
            const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
            return aName.localeCompare(bName);
          });
        } else {
          filtered.sort((a, b) => {
            const aDate = a.work_start_date || "";
            const bDate = b.work_start_date || "";
            return bDate.localeCompare(aDate);
          });
        }

        return filtered;
      }

      const merged: Doctor[] = profiles
        .map((profile) => {
          const doctorInfo = doctors?.find((d) => d.id === profile.id);
          const user = authDoctors?.users.find((u) => u.id === profile.id);

          return {
            id: profile.id,
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: user?.email || "",
            password: user?.user_metadata?.password || "",
            specialization: doctorInfo?.specialization || null,
            work_start_date: doctorInfo?.work_start_date?.toString() || "",
          };
        })
        .filter((doctor) => doctor.id);

      let filtered = merged;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = merged.filter(
          (doctor) =>
            doctor.first_name?.toLowerCase().includes(query) ||
            doctor.last_name?.toLowerCase().includes(query) ||
            `${doctor.first_name} ${doctor.last_name}`
              .toLowerCase()
              .includes(query) ||
            doctor.specialization?.toLowerCase().includes(query)
        );
        filtered.sort((a, b) => {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
          return aName.localeCompare(bName);
        });
      } else {
        filtered.sort((a, b) => {
          const aDate = a.work_start_date || "";
          const bDate = b.work_start_date || "";
          return bDate.localeCompare(aDate);
        });
      }

      return filtered;
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDoctorById = useCallback(async (doctorId: string) => {
    try {
      setIsLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", doctorId)
        .single();

      if (!profile) return null;

      const { data: doctor } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", doctorId)
        .single();

      return {
        ...doctor,
        profile,
      };
    } catch (error) {
      console.error("Failed to fetch doctor:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDoctor = useCallback(
    async (
      doctorId: string,
      updates: {
        first_name?: string;
        last_name?: string;
        specialization?: string;
        work_start_date?: string;
      }
    ) => {
      try {
        setIsLoading(true);

        if (updates.first_name || updates.last_name) {
          const { error: authError } =
            await supabaseAdmin.auth.admin.updateUserById(doctorId, {
              user_metadata: {
                first_name: updates.first_name || "",
                last_name: updates.last_name || "",
              },
            });

          if (authError) {
            console.error("Auth update error:", authError);
            throw authError;
          }
        }

        if (updates.first_name || updates.last_name) {
          const updateData: Record<string, string> = {};
          if (updates.first_name) updateData.first_name = updates.first_name;
          if (updates.last_name) updateData.last_name = updates.last_name;

          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("id", doctorId);

          if (profileError) {
            console.error("Profile update error:", profileError);
            throw profileError;
          }
        }

        if (updates.specialization || updates.work_start_date) {
          const updateData: Record<string, string | null> = {};
          if (updates.specialization)
            updateData.specialization = updates.specialization;
          if (updates.work_start_date)
            updateData.work_start_date = updates.work_start_date;

          const { error: doctorError } = await supabaseAdmin
            .from("doctors")
            .update(updateData)
            .eq("id", doctorId)
            .select();

          if (doctorError) {
            console.error("Doctor update error:", doctorError);
            throw doctorError;
          }
        }

        return true;
      } catch (error) {
        console.error("Failed to update doctor:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getVisits = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      setIsLoading(true);

      let query = supabaseAdmin.from("appointments").select("*");

      if (startDate && endDate) {
        query = query
          .gte("scheduled_time", startDate.toISOString())
          .lte("scheduled_time", endDate.toISOString());
      }

      const { data, error } = await query.order("scheduled_time", {
        ascending: true,
      });

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message?.includes("does not exist")
        ) {
          console.error("Table 'appointments' does not exist:", error);
          return [];
        }
        console.error("Error fetching appointments:", error);
        return [];
      }

      console.log("Fetched appointments:", data?.length || 0, data);
      return data || [];
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReports = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      setIsLoading(true);

      let query = supabaseAdmin.from("reports").select("*");

      if (startDate && endDate) {
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query.order("created_at", {
        ascending: true,
      });

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message?.includes("does not exist")
        ) {
          console.error("Table 'reports' does not exist:", error);
          return [];
        }
        console.error("Error fetching reports:", error);
        return [];
      }

      console.log("Fetched reports:", data?.length || 0, data);
      return data || [];
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addDoctor,
    deleteDoctor,
    getDoctors,
    getDoctorById,
    updateDoctor,
    getVisits,
    getReports,
    isLoading,
  };
};
