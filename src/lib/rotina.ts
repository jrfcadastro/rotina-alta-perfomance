export type Tag = "Foco" | "Trabalho" | "Descanso" | "Aprendizado";
export const tagClass: Record<Tag, string> = {
  Foco: "bg-tag-foco/12 text-tag-foco border-tag-foco/40",
  Trabalho: "bg-tag-trabalho/12 text-tag-trabalho border-tag-trabalho/40",
  Descanso: "bg-tag-descanso/12 text-tag-descanso border-tag-descanso/40",
  Aprendizado: "bg-tag-aprendizado/12 text-tag-aprendizado border-tag-aprendizado/40",
};

export const rotina: [string, string, string, string, Tag][] = [
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

export const adaptacoes = [
  ["Acordar mais tarde", "Reduzir bloco matinal para 30min", "5:30-6:00: Foco Profundo #1"],
  ["Filhos/responsabilidades", "Treino no horário de almoço", "12:30-13:00 (HIIT rápido)"],
  ["Cansaço à tarde", "Substituir power nap por respiração", "4-7-8 (10min)"],
];
export const checklist = [
  ["Segunda-feira", "Planejamento semanal", "30min"],
  ["Sexta-feira", "Revisão de métricas", "30min"],
  ["Sábado/Domingo", "Dia offline (recuperação)", "24h (1 dia)"],
];
export const ferramentas = [
  ["🚫", "Foco", "Cold Turkey (bloqueador de distrações)"],
  ["⏱️", "Gestão de Tempo", "Toggl Track"],
  ["🤖", "Automação", "Zapier/Make"],
];


/** Minutes in a "H:MM-H:MM" range; single times count as 0. */
export function minutes(range: string): number {
  const [s, e] = range.split("-");
  if (!e) return 0;
  const m = (t: string) => { const [h = 0, mm = 0] = t.split(":").map(Number); return h * 60 + mm; };
  return m(e) - m(s ?? e);
}

/** "YYYY-MM-DD" in the viewer's local timezone (not UTC). */
export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Consecutive local days (ending today, or yesterday if today has none) with at least one task done. */
export function streak(doneDays: Set<string>, today: Date): number {
  const d = new Date(today);
  if (!doneDays.has(dateKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (doneDays.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

const toMin = (t: string) => { const [h = 0, m = 0] = t.split(":").map(Number); return h * 60 + m; };

/**
 * Index of the block running at `now` (local time), or -1 in gaps between blocks.
 * Ranges are start-inclusive / end-exclusive. A single time ("22:00") runs until the
 * first block of the next day starts, wrapping past midnight.
 */
export function currentBlock(now: Date, blocks: readonly (readonly string[])[] = rotina): number {
  const t = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < blocks.length; i++) {
    const [s, e] = (blocks[i]![0] ?? "").split("-");
    if (s && e && t >= toMin(s) && t < toMin(e)) return i;
  }
  const last = blocks.length - 1;
  const [ls, le] = (blocks[last]?.[0] ?? "").split("-");
  if (ls && !le) {
    const first = toMin((blocks[0]![0] ?? "").split("-")[0]!);
    if (t >= toMin(ls) || t < first) return last;
  }
  return -1;
}

/** The last `n` local days ending at `today`, oldest first. */
export function lastDays(today: Date, n = 7): { key: string; date: Date }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1 - i), 12);
    return { key: dateKey(d), date: d };
  });
}
