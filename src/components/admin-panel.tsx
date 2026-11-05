import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { createUser, deleteUser, listUsers, type AppUser } from "@/lib/admin.functions";
import { authErrorMessage, validateCredentials } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Admin-only: list, create and delete users. The server re-checks the admin role on every call. */
export function AdminPanel({ selfId }: { selfId: string }) {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setUsers(await listUsers());
    } catch (err) {
      setUsers([]);
      setError(authErrorMessage(err instanceof Error ? err.message : ""));
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setOk(null);
    const invalid = validateCredentials({ username, password });
    if (invalid) return setError(invalid);
    setBusy(true);
    try {
      await createUser({ data: { username, password } });
      setOk(`Usuário "${username.trim().toLowerCase()}" criado.`);
      setUsername(""); setPassword("");
      await refresh();
    } catch (err) {
      setError(authErrorMessage(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setError(null); setOk(null); setConfirmId(null);
    try {
      await deleteUser({ data: { id } });
      await refresh();
    } catch (err) {
      setError(authErrorMessage(err instanceof Error ? err.message : ""));
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <form onSubmit={add} className="grid content-start gap-4" noValidate>
        <h3 className="flex items-center gap-2 font-bold"><UserPlus className="size-5 text-primary" />Novo usuário</h3>
        <div className="grid gap-2">
          <Label htmlFor="new-username">Nome de usuário</Label>
          <Input id="new-username" autoComplete="off" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-password">Senha</Label>
          <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {ok && <p role="status" className="text-sm text-primary">{ok}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Criando…" : "Criar usuário"}</Button>
      </form>

      <div>
        <h3 className="mb-3 font-bold">Usuários {users ? `(${users.length})` : ""}</h3>
        {users === null && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {users?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário.</p>}
        <ul className="divide-y divide-border rounded-xl border border-border">
          {users?.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">{u.username}</span>
                {u.role === "admin" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"><ShieldCheck className="size-3" />admin</span>
                )}
              </div>
              {u.id !== selfId && (
                confirmId === u.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <button className="font-semibold text-destructive hover:underline" onClick={() => remove(u.id)}>Confirmar exclusão</button>
                    <button className="text-muted-foreground hover:underline" onClick={() => setConfirmId(null)}>Cancelar</button>
                  </span>
                ) : (
                  <button aria-label={`Excluir ${u.username}`} onClick={() => setConfirmId(u.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"><Trash2 className="size-4" /></button>
                )
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
