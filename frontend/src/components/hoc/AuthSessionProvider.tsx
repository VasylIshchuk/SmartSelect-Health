"use client";

import React, { createContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type ExtendedSession =
  | (Session & {
      role: string;
    })
  | null;

interface AuthSessionContextType {
  session: ExtendedSession;
  setSession: React.Dispatch<React.SetStateAction<ExtendedSession>>;
}

export const AuthSessionContext = createContext<AuthSessionContextType>({
  session: null,
  setSession: () => {},
});

export const AuthSessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<ExtendedSession>(null);
  const enrichSession = async (
    session: Session | null
  ): Promise<ExtendedSession> => {
    if (!session) return null;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    return {
      ...session,
      role: data?.role,
    };
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      enrichSession(data.session).then((enriched) => {
        setSession(enriched);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      enrichSession(s).then((enriched) => {
        setSession(enriched);
      });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthSessionContext.Provider value={{ session, setSession }}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useSession = () => React.useContext(AuthSessionContext);
