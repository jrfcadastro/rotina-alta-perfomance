import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Lock, Target, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin } from "@/lib/admin.functions";
import { authErrorMessage, usernameToEmail, validateCredentials } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const highlights = [
  { icon: Zap, text: "Rotina bloco a bloco, das 5:00 às 22:00" },
  { icon: Target, text: "Foco profundo e progresso diário" },
  { icon: TrendingUp, text: "Streak e histórico dos últimos 7 dias" },
];

/** The only thing a logged-out visitor sees. Accounts are created by the admin (no self sign-up). */
export function LoginPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Make sure the admin account exists (idempotent, takes no input).
  useEffect(() => { ensureAdmin().catch(() => {}); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalid = validateCredentials({ username, password });
    if (invalid) return setError(invalid);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
      if (err) setError(authErrorMessage(err.message));
    } catch (err) {
      setError(authErrorMessage(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-app px-4 py-10 font-sans text-foreground antialiased">
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass grid w-full max-w-4xl overflow-hidden rounded-3xl shadow-soft md:grid-cols-[1.1fr_1fr]"
      >
        <section className="flex flex-col justify-between gap-10 p-8 md:p-12">
          <div>
            <img src="/icon-192.png" alt="" width={72} height={72} className="size-16 drop-shadow-lg md:size-[72px]" />
            <h1 className="text-gradient mt-6 text-3xl font-bold tracking-[-0.02em] md:text-5xl">Rotina de Alta Performance</h1>
            <p className="mt-3 max-w-sm text-muted-foreground">Energia pela manhã, foco profundo no meio do dia e recuperação à noite.</p>
          </div>
          <ul className="grid gap-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Icon className="size-4" /></span>
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border bg-secondary/40 p-8 md:border-l md:border-t-0 md:p-12">
          <div className="mb-6 flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Acesso restrito</h2>
          </div>
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <div className="grid gap-2">
              <Label htmlFor="login-username">Nome de usuário</Label>
              <Input id="login-username" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus
                value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input id="login-password" type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="mt-1">{busy ? "Entrando…" : "Entrar"}</Button>
          </form>
          <p className="mt-6 text-xs text-muted-foreground">Não tem acesso? Peça ao administrador para criar sua conta.</p>
        </section>
      </motion.main>
    </div>
  );
}
