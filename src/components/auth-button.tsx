import { LogOut, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { emailToUsername } from "@/lib/auth";
import { useSession } from "@/lib/use-session";

/** Header chip for a logged-in user: shows who is logged in and a logout button. Logged-out visitors never reach the app (see LoginPanel). */
export function AuthButton() {
  const { session, isAdmin } = useSession();
  if (!session) return null;

  const name = (session.user.user_metadata?.["username"] as string | undefined) ?? emailToUsername(session.user.email);
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 items-center gap-1.5 text-sm text-muted-foreground md:inline-flex" title={name}>
        {isAdmin ? <ShieldCheck className="size-4 shrink-0 text-primary" /> : <User className="size-4 shrink-0" />}
        <span className="truncate">{name}</span>
      </span>
      <button
        onClick={() => supabase.auth.signOut()}
        aria-label="Sair"
        className="inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-semibold transition-all hover:border-primary hover:text-primary hover:shadow-glow"
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </div>
  );
}
