import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Current Supabase session, or null. `available` is false when Supabase isn't configured (app still works without login). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data }) => setSession(data.session)).catch(() => {});
      const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      return () => data.subscription.unsubscribe();
    } catch {
      setAvailable(false);
      return undefined;
    }
  }, []);

  const isAdmin = session?.user.app_metadata?.["role"] === "admin";
  return { session, available, isAdmin };
}
