import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

type Tag = "Foco" | "Trabalho" | "Descanso" | "Aprendizado";
const tagClass: Record<Tag, string> = {
  Foco: "bg-tag-foco/15 text-tag-foco",
  Trabalho: "bg-tag-trabalho/15 text-tag-trabalho",
  Descanso: "bg-tag-descanso/15 text-tag-descanso",
  Aprendizado: "bg-tag-aprendizado/15 text-tag-aprendizado",
};

const rotina: [string, string, string, string, Tag][] = [
  ["5:00-5:10", "Hidratação + luz solar", "500ml água com limão", "Ativa cortisol natural", "Descanso"],
  ["5:10-5:30", "Meditação + visualização de metas", "10min meditação + 5min visualização", "Foco no propósito", "Foco"],
  ["5:30-6:00", "Exercício (HIIT ou yoga + musculação)", "15min HIIT + 15min musculação", "Libera BDNF", "Descanso"],
  ["6:00-6:30", "Banho frio + café da manhã", "Proteínas (ovos, abacate)", "Evitar carboidratos refinados", "Descanso"],
  ["6:30-7:00", "Foco Profundo #1", "Tarefa mais crítica do dia", "Modo avião no celular", "Foco"],
  ["7:30-9:30", "Foco Profundo #2 (trabalho)", "Time-blocking (90min + 10min pausa)", "Alongamento na pausa", "Foco"],
  ["9:30-9:45", "Lanche rápido + caminhada", "Nozes/frutas + 5min caminhada", "Ativar circulação", "Descanso"],
  ["9:45-11:45", "Trabalho semi-focado", "Pomodoro avançado (50/10)", "Emails/reuniões curtas", "Trabalho"],
  ["11:45-12:30", "Almoço (sem telas)", "Proteína + gordura saudável", "Mastigação lenta", "Descanso"],
  ["12:30-14:00", "Tarefas operacionais", "Batch processing + automações", "Filtros de e-mail", "Trabalho"],
  ["14:00-14:15", "Power Nap", "10min descanso", "Escuro/tampões de ouvido", "Descanso"],
  ["14:15-16:00", "Bloco colaborativo", "Reuniões 25/50min com agenda", "Standing meetings", "Trabalho"],
  ["16:00-17:00", "Tarefas leves + planejamento", "Notion/ClickUp", "Revisar metas diárias", "Trabalho"],
  ["17:00-17:30", "Síntese do dia", "3 vitórias + 1 aprendizado", "Registrar em diário", "Aprendizado"],
  ["17:30-18:30", "Deslocamento + transição mental", "Podcast/música instrumental", "Evitar notícias", "Descanso"],
  ["18:30-19:30", "Treino", "45min intenso", "Liberar tensão", "Descanso"],
  ["19:30-20:30", "Jantar leve + tempo livre", "Proteína + vegetais", "Sem trabalho", "Descanso"],
  ["20:30-21:30", "Aprendizado/projeto pessoal", "Curso/livro (60min)", "Modo foco", "Aprendizado"],
  ["21:30-22:00", "Rotina noturna", "Luz âmbar + alongamento + diário", "Gratidão + planejamento", "Descanso"],
  ["22:00", "Dormir", "7-8h de sono", "Temperatura 19°C", "Descanso"],
];

const adaptacoes = [
  ["Acordar mais tarde", "Reduzir bloco matinal para 30min", "5:30-6:00: Foco Profundo #1"],
  ["Filhos/responsabilidades", "Treino no horário de almoço", "12:30-13:00 (HIIT rápido)"],
  ["Cansaço à tarde", "Substituir power nap por respiração", "4-7-8 (10min)"],
];
const checklist = [
  ["Segunda-feira", "Planejamento semanal", "30min"],
  ["Sexta-feira", "Revisão de métricas", "30min"],
  ["Sábado/Domingo", "Dia offline (recuperação)", "24h (1 dia)"],
];
const ferramentas = [
  ["🚫", "Foco", "Cold Turkey (bloqueador de distrações)"],
  ["⏱️", "Gestão de Tempo", "Toggl Track"],
  ["🤖", "Automação", "Zapier/Make"],
];

const tabs = ["Rotina Diária", "Adaptações", "Checklist Semanal", "Ferramentas"];
const today = () => new Date().toISOString().slice(0, 10);

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm md:text-base">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`bg-primary px-3 py-3 text-left font-semibold text-primary-foreground ${i === 0 ? "rounded-tl-lg" : ""} ${i === head.length - 1 ? "rounded-tr-lg" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border transition-colors even:bg-muted hover:bg-secondary">
              {r.map((c, j) => <td key={j} className="px-3 py-3 align-top">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Index() {
  const [tab, setTab] = useState(0);
  const [dark, setDark] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setTab(Number(localStorage.getItem("rap-tab") ?? 0) || 0);
    setDark(localStorage.getItem("rap-dark") === "1");
    try { setDone(JSON.parse(localStorage.getItem("rap-done-" + today()) ?? "{}")); } catch { /* ignore */ }
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const pick = (i: number) => { setTab(i); localStorage.setItem("rap-tab", String(i)); };
  const toggleDark = () => { localStorage.setItem("rap-dark", dark ? "0" : "1"); setDark(!dark); };
  const toggle = (i: number) => {
    const n = { ...done, [i]: !done[i] };
    setDone(n);
    localStorage.setItem("rap-done-" + today(), JSON.stringify(n));
  };
  const count = Object.values(done).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="rounded-b-xl bg-header px-4 py-8 text-center text-primary-foreground shadow-soft md:py-10">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-5xl">Rotina de Alta Performance</h1>
        <p className="mt-3 text-base opacity-90 md:text-xl">Seu dashboard diário de produtividade e bem-estar</p>
        <div className="no-print mt-5 flex justify-center gap-2">
          <button onClick={toggleDark} className="rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold hover:bg-primary-foreground/25">
            {dark ? "☀️ Modo claro" : "🌙 Modo escuro"}
          </button>
          <button onClick={() => window.print()} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90">
            🖨️ Imprimir / PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-5">
        <nav className="no-print mb-6 flex flex-wrap justify-center gap-2">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => pick(i)}
              className={`rounded-full px-4 py-2 text-sm font-semibold shadow-soft transition-colors md:px-6 md:py-3 md:text-base ${tab === i ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground hover:bg-secondary"}`}>
              {t}
            </button>
          ))}
        </nav>

        <section key={tab} className="animate-fade-up rounded-xl bg-card p-3 text-card-foreground shadow-soft sm:p-5">
          <h2 className="mb-4 text-xl font-bold text-primary md:text-2xl">{tabs[tab]}</h2>
          {tab === 0 && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(tagClass) as Tag[]).map((t) => (
                    <span key={t} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagClass[t]}`}>{t}</span>
                  ))}
                </div>
                <div className="text-sm font-semibold">
                  Hoje: <span className="text-primary">{count}/{rotina.length}</span> concluídas
                  <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-accent transition-all" style={{ width: `${(count / rotina.length) * 100}%` }} />
                  </div>
                </div>
              </div>
              <Table
                head={["✓", "Horário", "Atividade", "Método/Ferramenta", "Dica Chave"]}
                rows={rotina.map(([h, a, m, d, tag], i) => [
                  <input type="checkbox" aria-label={`Concluir ${a}`} checked={!!done[i]} onChange={() => toggle(i)} className="size-4 accent-primary" />,
                  <span className="whitespace-nowrap font-semibold">{h}</span>,
                  <span className={done[i] ? "line-through opacity-60" : ""}>
                    {a.startsWith("Foco Profundo") ? <strong className="text-primary">{a}</strong> : a}{" "}
                    <span className={`ml-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tagClass[tag]}`}>{tag}</span>
                  </span>,
                  m,
                  <span className="text-muted-foreground">{d}</span>,
                ])}
              />
            </>
          )}
          {tab === 1 && <Table head={["Cenário", "Ajuste", "Alternativa"]} rows={adaptacoes} />}
          {tab === 2 && <Table head={["Dia", "Ação", "Duração"]} rows={checklist} />}
          {tab === 3 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {ferramentas.map(([e, t, d]) => (
                <div key={t} className="rounded-lg border border-border border-l-4 border-l-accent bg-muted p-5">
                  <div className="text-3xl">{e}</div>
                  <h3 className="mt-2 font-bold text-primary">{t}</h3>
                  <p className="text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="px-4 py-6 text-center text-sm text-muted-foreground">
        Rotina de Alta Performance © 2025 | Implemente e adapte conforme sua realidade
      </footer>
    </div>
  );
}
