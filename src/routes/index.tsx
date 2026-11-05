import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChartColumn, Check, ShieldCheck, Clock, Flame, Pencil, Printer, Target, Zap, Shuffle, CalendarCheck, Wrench, Moon, Sun } from "lucide-react";
import { AdminPanel } from "@/components/admin-panel";
import { AuthButton } from "@/components/auth-button";
import { LoginPanel } from "@/components/login-panel";
import { AdaptacoesEditor, ChecklistEditor, RotinaEditor } from "@/components/plan-editor";
import { clone, defaultPlan, sortRotina, validatePlan, type Plan } from "@/lib/plan";
import { useSession } from "@/lib/use-session";
import { countDone, focusTotals, loadCounts, loadDone, loadPlan, saveDone, savePlan } from "@/lib/storage";
import { currentBlock, dateKey, ferramentas, lastDays, streak, tagClass, type Tag } from "@/lib/rotina";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rotina de Alta Performance" },
      { name: "description", content: "Dashboard pessoal para acompanhar uma rotina diária otimizada de produtividade." },
      { property: "og:title", content: "Rotina de Alta Performance" },
      { property: "og:description", content: "Rotina diária, adaptações, checklist semanal e ferramentas essenciais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tabs = [
  { label: "Rotina Diária", icon: Zap, sub: "Seu dia das 5:00 às 22:00, bloco a bloco." },
  { label: "Adaptações", icon: Shuffle, sub: "Ajustes para quando a vida não segue o plano." },
  { label: "Checklist Semanal", icon: CalendarCheck, sub: "Rituais que mantêm a semana no trilho." },
  { label: "Ferramentas", icon: Wrench, sub: "O kit essencial para foco e automação." },
  { label: "Histórico", icon: ChartColumn, sub: "Blocos concluídos nos últimos 7 dias." },
];
const adminTab = { label: "Admin", icon: ShieldCheck, sub: "Gerencie quem pode entrar no app." };
const todayKey = () => dateKey(new Date());
const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.28 } };

function TagPill({ tag }: { tag: Tag }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tagClass[tag]}`}>{tag}</span>;
}

function Circle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      animate={{ scale: on ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}
      className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-input hover:border-primary"}`}>
      {on && <Check className="size-3.5" strokeWidth={3} />}
    </motion.button>
  );
}

function Strike({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className={`relative inline transition-opacity duration-300 ${on ? "opacity-50" : ""}`}>
      {children}
      <span className={`pointer-events-none absolute left-0 top-1/2 h-px bg-current transition-all duration-500 ${on ? "w-full" : "w-0"}`} />
    </span>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button role="switch" aria-checked={on} aria-label="Modo escuro" onClick={onChange}
      className={`relative h-7 w-12 rounded-full border border-border transition-colors ${on ? "bg-primary" : "bg-secondary"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 grid size-6 place-items-center rounded-full bg-background shadow-soft ${on ? "right-0.5" : "left-0.5"}`}>
        {on ? <Moon className="size-3.5 text-primary" /> : <Sun className="size-3.5 text-accent" />}
      </motion.span>
    </button>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative size-24">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <defs>
          <linearGradient id="dg" x1="0" x2="1"><stop offset="0" stopColor="var(--primary)" /><stop offset="1" stopColor="var(--primary-deep)" /></linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--secondary)" strokeWidth="7" />
        <motion.circle cx="40" cy="40" r={r} fill="none" stroke="url(#dg)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xl font-bold">{Math.round(pct * 100)}%</div>
    </div>
  );
}

function SimpleList({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div>
      <div className="hidden grid-cols-3 gap-4 px-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        {head.map((h) => <div key={h}>{h}</div>)}
      </div>
      {rows.map((r, i) => (
        <div key={i}>
          <div className="divider-fade" />
          <div className="grid gap-1 rounded-xl px-4 py-4 transition-colors hover:bg-hover-row md:grid-cols-3 md:gap-4">
            <div className="font-semibold">{r[0]}</div>
            <div>{r[1]}</div>
            <div><span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-sm text-primary">{r[2]}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function History({ counts, today, total }: { counts: Record<string, number>; today: string; total: number }) {
  const week = lastDays(new Date());
  const vals = week.map(({ key }) => Math.min(counts[key] ?? 0, total));
  const avg = total ? vals.reduce((a, b) => a + b, 0) / week.length / total : 0;
  const best = Math.max(...vals);
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-6 text-sm">
        <div><div className="text-muted-foreground">Média diária</div><div className="text-lg font-bold">{Math.round(avg * 100)}%</div></div>
        <div><div className="text-muted-foreground">Melhor dia</div><div className="text-lg font-bold">{best} de {total} blocos</div></div>
        <div><div className="text-muted-foreground">Dias ativos</div><div className="text-lg font-bold">{vals.filter(Boolean).length} de {week.length}</div></div>
      </div>
      <div className="flex h-56 items-end gap-2 sm:gap-4" role="list" aria-label="Blocos concluídos por dia">
        {week.map(({ key, date }, i) => {
          const v = vals[i]!;
          const pct = total ? v / total : 0;
          const isToday = key === today;
          return (
            <div key={key} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              aria-label={`${date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}: ${v} de ${total} blocos`}>
              <span className="text-xs font-semibold">{v > 0 ? `${Math.round(pct * 100)}%` : "–"}</span>
              <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-lg bg-secondary">
                <motion.div className={`w-full rounded-t-lg ${isToday ? "bar-shimmer" : "bg-primary/60"}`}
                  initial={{ height: 0 }} animate={{ height: `${pct * 100}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} />
              </div>
              <div className={`text-center text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                <div className="capitalize">{date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
                <div>{date.getDate()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Index() {
  const [tab, setTab] = useState(0);
  const { session, loading, available, isAdmin } = useSession();
  const [dark, setDark] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [draft, setDraft] = useState<Plan | null>(null); // non-null while editing
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({}); // day -> blocks done
  const days = useMemo(() => new Set(Object.keys(counts).filter((k) => counts[k]! > 0)), [counts]);
  const [today, setToday] = useState(todayKey);
  const [now, setNow] = useState<Date | null>(null); // null until mounted (avoids SSR hydration mismatch)

  // Detect midnight rollover while the tab stays open.
  useEffect(() => {
    const check = () => { setToday(todayKey()); setNow(new Date()); };
    check();
    const id = setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);

  // Reload the checklist whenever the day changes.
  useEffect(() => {
    setDone(loadDone(localStorage, today));
  }, [today]);

  useEffect(() => {
    setTab(Number(localStorage.getItem("rap-tab") ?? 0) || 0);
    setDark(localStorage.getItem("rap-dark") !== "0");
    setCounts(loadCounts(localStorage));
    setPlan(loadPlan(localStorage));
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const pick = (i: number) => { setTab(i); localStorage.setItem("rap-tab", String(i)); };
  const toggleDark = () => { localStorage.setItem("rap-dark", dark ? "0" : "1"); setDark(!dark); };
  const ids = useMemo(() => plan.rotina.map((b) => b.id), [plan.rotina]);
  const toggle = (id: string) => {
    const n = { ...done, [id]: !done[id] };
    setDone(n);
    saveDone(localStorage, today, n);
    setCounts((c) => ({ ...c, [today]: countDone(n, ids) }));
  };

  const startEdit = () => { setDraft(clone(plan)); setEditError(null); setConfirmReset(false); };
  const cancelEdit = () => { setDraft(null); setEditError(null); setConfirmReset(false); };
  const saveEdit = () => {
    if (!draft) return;
    const err = validatePlan(draft);
    if (err) return setEditError(err);
    const next = { ...draft, rotina: sortRotina(draft.rotina) };
    savePlan(localStorage, next);
    setPlan(next);
    setCounts((c) => ({ ...c, [today]: countDone(done, next.rotina.map((b) => b.id)) }));
    cancelEdit();
  };
  const resetDraft = () => { setDraft(defaultPlan()); setEditError(null); setConfirmReset(false); };

  const total = plan.rotina.length;
  const count = countDone(done, ids);
  const pct = total ? count / total : 0;
  const focus = useMemo(() => focusTotals(done, plan.rotina), [done, plan.rotina]);
  const current = now ? currentBlock(now, plan.rotina) : -1;
  const st = streak(days, new Date());
  void today; // re-render on day change so the streak refreshes
  const allTabs = isAdmin ? [...tabs, adminTab] : tabs;
  const cur = tab < allTabs.length ? tab : 0; // saved tab may be Admin after logout
  const T = allTabs[cur] ?? tabs[0]!;

  // Logged-out visitors see only the login panel. If Supabase isn't configured at all, the app stays usable.
  if (loading) return <div className="min-h-screen bg-app" aria-busy="true" />;
  if (available && !session) return <LoginPanel />;

  return (
    <div className="min-h-screen bg-app font-sans text-foreground antialiased">
      <header className="glass sticky top-0 z-20 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow"><Zap className="size-5" /></div>
            <span className="font-bold tracking-tight">Alta Performance</span>
          </div>
          <div className="no-print flex items-center gap-3">
            <Switch on={dark} onChange={toggleDark} />
            <AuthButton />
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-semibold transition-all hover:border-primary hover:text-primary hover:shadow-glow">
              <Printer className="size-4" /><span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <motion.div {...fade} className="mb-10">
          <h1 className="text-gradient text-4xl font-bold tracking-[-0.02em] md:text-6xl">Rotina de Alta Performance</h1>
          <p className="mt-3 max-w-xl text-muted-foreground md:text-lg">Energia pela manhã, foco profundo no meio do dia e recuperação à noite.</p>
        </motion.div>

        <motion.section {...fade} transition={{ duration: 0.4, delay: 0.05 }} className="glass mb-8 grid gap-6 rounded-2xl p-6 shadow-soft sm:grid-cols-3 md:p-8">
          <div className="flex items-center gap-5">
            <Donut pct={pct} />
            <div><div className="text-sm text-muted-foreground">Resumo do dia</div><div className="text-lg font-bold">{count} de {total} blocos</div></div>
          </div>
          <div className="flex items-center gap-4 sm:border-l sm:border-border sm:pl-6">
            <div className="grid size-12 place-items-center rounded-2xl border border-tag-foco/40 bg-tag-foco/12 text-tag-foco"><Target className="size-6" /></div>
            <div><div className="text-sm text-muted-foreground">Foco total</div><div className="text-lg font-bold">{Math.floor(focus.got / 60)}h{String(focus.got % 60).padStart(2, "0")} <span className="text-sm font-medium text-muted-foreground">/ {Math.floor(focus.total / 60)}h{String(focus.total % 60).padStart(2, "0")}</span></div></div>
          </div>
          <div className="flex items-center gap-4 sm:border-l sm:border-border sm:pl-6">
            <div className="grid size-12 place-items-center rounded-2xl border border-tag-descanso/40 bg-tag-descanso/12 text-tag-descanso"><Flame className="size-6" /></div>
            <div><div className="text-sm text-muted-foreground">Streak</div><div className="text-lg font-bold">{st} {st === 1 ? "dia" : "dias"} seguidos</div></div>
          </div>
        </motion.section>

        <nav className="no-print no-scrollbar glass mb-8 flex gap-1 overflow-x-auto rounded-2xl p-1.5 md:inline-flex">
          {allTabs.map((t, i) => (
            <button key={t.label} onClick={() => pick(i)}
              className={`relative shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${cur === i ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {cur === i && <motion.span layoutId="pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-xl bg-primary shadow-glow" />}
              <span className="relative flex items-center gap-2"><t.icon className="size-4" />{t.label}</span>
            </button>
          ))}
        </nav>

        <section className="glass rounded-2xl p-5 shadow-soft md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={cur} {...fade}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><T.icon className="size-6 text-primary" />{T.label}</h2>
                  <p className="mt-1 text-muted-foreground">{T.sub}</p>
                </div>
                {cur === 0 && (
                  <div className="w-full sm:w-64">
                    <div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Hoje</span><span className="font-semibold">{count}/{total} concluídos</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <motion.div className="bar-shimmer h-full rounded-full" animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                )}
              </div>

              {cur <= 2 && (
                <div className="no-print mb-6 flex flex-wrap items-center gap-3">
                  {!draft ? (
                    <button onClick={startEdit}
                      className="inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-semibold transition-all hover:border-primary hover:text-primary hover:shadow-glow">
                      <Pencil className="size-4" />Editar
                    </button>
                  ) : (
                    <>
                      <button onClick={saveEdit} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
                        <Check className="size-4" />Salvar
                      </button>
                      <button onClick={cancelEdit} className="rounded-xl border border-input px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary">Cancelar</button>
                      {confirmReset ? (
                        <span className="flex items-center gap-2 text-sm">
                          <button onClick={resetDraft} className="font-semibold text-destructive hover:underline">Confirmar restauração</button>
                          <button onClick={() => setConfirmReset(false)} className="text-muted-foreground hover:underline">Não</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmReset(true)} className="text-sm text-muted-foreground underline-offset-4 hover:underline">Restaurar padrão</button>
                      )}
                    </>
                  )}
                  {draft && editError && <p role="alert" className="basis-full text-sm text-destructive">{editError}</p>}
                  {draft && !editError && <p className="basis-full text-xs text-muted-foreground">Suas alterações ficam salvas neste navegador. “Restaurar padrão” só vale depois de Salvar.</p>}
                </div>
              )}

              {cur === 0 && draft && <RotinaEditor rows={draft.rotina} onChange={(rotina) => setDraft({ ...draft, rotina })} />}
              {cur === 1 && draft && <AdaptacoesEditor rows={draft.adaptacoes} onChange={(adaptacoes) => setDraft({ ...draft, adaptacoes })} />}
              {cur === 2 && draft && <ChecklistEditor rows={draft.checklist} onChange={(checklist) => setDraft({ ...draft, checklist })} />}

              {cur === 0 && !draft && (
                <div>
                  <div className="hidden grid-cols-[2rem_8rem_1.4fr_1.2fr_1fr] gap-4 px-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
                    <div /><div>Horário</div><div>Atividade</div><div>Método</div><div>Dica chave</div>
                  </div>
                  {plan.rotina.map(({ id, time: h, activity: a, method: m, tip: d, tag }, i) => {
                    const on = !!done[id];
                    const isNow = i === current;
                    return (
                      <div key={id}>
                        <div className="divider-fade" />
                        <div aria-current={isNow ? "time" : undefined}
                          className={`grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 rounded-xl px-3 py-4 transition-colors hover:bg-hover-row md:grid-cols-[2rem_8rem_1.4fr_1.2fr_1fr] md:items-center md:px-4 ${isNow ? "bg-primary/10 ring-1 ring-primary/50" : ""}`}>
                          <div className="row-span-3 pt-0.5 md:row-span-1 md:pt-0"><Circle on={on} onClick={() => toggle(id)} label={`Concluir ${a}`} /></div>
                          <div><span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-xs font-semibold shadow-soft"><Clock className="size-3" />{h}</span></div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Strike on={on}>{a.startsWith("Foco Profundo") ? <strong className="text-primary">{a}</strong> : <span className="font-medium">{a}</span>}</Strike>
                            <TagPill tag={tag} />
                            {isNow && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-glow"><span className="size-1.5 animate-pulse rounded-full bg-current" />Agora</span>}
                          </div>
                          <div className={`text-sm text-muted-foreground transition-opacity md:col-auto ${on ? "opacity-50" : ""}`}>{m}</div>
                          <div className={`col-start-2 hidden text-sm text-muted-foreground transition-opacity md:col-auto md:block ${on ? "opacity-50" : ""}`}>{d}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {cur === 1 && !draft && <SimpleList head={["Cenário", "Ajuste", "Alternativa"]} rows={plan.adaptacoes.map((r) => [r.scenario, r.adjustment, r.alternative])} />}
              {cur === 2 && !draft && <SimpleList head={["Dia", "Ação", "Duração"]} rows={plan.checklist.map((r) => [r.day, r.action, r.duration])} />}
              {cur === 4 && <History counts={counts} today={today} total={total} />}
              {cur === 5 && isAdmin && session && <AdminPanel selfId={session.user.id} />}
              {cur === 3 && (
                <div className="grid gap-5 sm:grid-cols-3">
                  {ferramentas.map(([e, t, d], i) => (
                    <motion.div key={t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
                      className="rounded-2xl border border-border bg-muted p-6 transition-shadow hover:shadow-glow">
                      <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-2xl">{e}</div>
                      <h3 className="mt-4 font-bold">{t}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
