import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Current Supabase session, or null.
 * - `loading` is true until the stored session has been read (avoids flashing the login panel).
 * - `available` is false when Supabase isn't configured.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    try {
      supabase.auth
        .getSession()
        .then(({ data }) => setSession(data.session))
        .catch(() => {})
        .finally(() => setLoading(false));
      const { data } = supabase.auth.onAuthStateChange((_e, s) => {
        setSession(s);
        setLoading(false);
      });
      return () => data.subscription.unsubscribe();
    } catch {
      setAvailable(false);
      setLoading(false);
      return undefined;
    }
  }, []);

  const isAdmin = session?.user.app_metadata?.["role"] === "admin";
  return { session, loading, available, isAdmin };
}
