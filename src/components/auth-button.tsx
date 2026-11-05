import { useEffect, useState, type FormEvent } from "react";
import { LogIn, LogOut, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin } from "@/lib/admin.functions";
import { authErrorMessage, emailToUsername, usernameToEmail, validateCredentials } from "@/lib/auth";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const headerBtn =
  "inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-semibold transition-all hover:border-primary hover:text-primary hover:shadow-glow";

/** Optional login by username + password. Accounts are created by the admin (no self sign-up). */
export function AuthButton() {
  const { session, available, isAdmin } = useSession();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  // First time the login dialog opens, make sure the admin account exists (idempotent, no input).
  useEffect(() => {
    if (!open || seeded) return;
    setSeeded(true);
    ensureAdmin().catch(() => {});
  }, [open, seeded]);

  if (!available) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalid = validateCredentials({ username, password });
    if (invalid) return setError(invalid);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
      if (err) return setError(authErrorMessage(err.message));
      setOpen(false);
      setPassword("");
    } catch (err) {
      setError(authErrorMessage(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  if (session) {
    const name = (session.user.user_metadata?.["username"] as string | undefined) ?? emailToUsername(session.user.email);
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-40 items-center gap-1.5 text-sm text-muted-foreground md:inline-flex" title={name}>
          {isAdmin ? <ShieldCheck className="size-4 shrink-0 text-primary" /> : <User className="size-4 shrink-0" />}
          <span className="truncate">{name}</span>
        </span>
        <button onClick={() => supabase.auth.signOut()} aria-label="Sair" className={headerBtn}>
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => { setError(null); setOpen(true); }} className={headerBtn}>
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Entrar</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar</DialogTitle>
            <DialogDescription>O login é opcional. Seu progresso continua salvo neste navegador. Contas são criadas pelo administrador.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <div className="grid gap-2">
              <Label htmlFor="auth-username">Nome de usuário</Label>
              <Input id="auth-username" autoComplete="username" autoCapitalize="none" spellCheck={false}
                value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-password">Senha</Label>
              <Input id="auth-password" type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Aguarde…" : "Entrar"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
