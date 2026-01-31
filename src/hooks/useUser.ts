import { supabase } from "@/api/supabase";
import { use, useCallback, useEffect, useState } from "react";

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin";
  pesel?: string;
  date_of_birth?: string;
}

export const useUser = (userId: string | undefined) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setUser(data as UserProfile);
  }, [userId]);

  const updateProfileData = useCallback(async (pesel: string, birthDate: string) => {
    if (!userId) return
    await updatePatientProfile(userId, pesel, birthDate)
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, updateProfileData };
};


const updatePatientProfile = async (userId: string, pesel: string, birthDate: string) => {
  if (!pesel && !birthDate) {
    return;
  }

  const updates: any = {};

  if (pesel) updates.pesel = pesel;
  if (birthDate) updates.date_of_birth = birthDate;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw new Error(`Failed to update patient data: ${error.message}`);
};
