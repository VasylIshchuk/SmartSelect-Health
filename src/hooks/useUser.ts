import { supabase } from "@/api/supabase";
import { useCallback, useEffect, useState } from "react";

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

  const fetchData = useCallback(async () => {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]); 

  return { user };
};