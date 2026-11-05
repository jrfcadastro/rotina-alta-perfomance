import {
  defaultAdaptacoes,
  defaultChecklist,
  defaultRotina,
  tags,
  type Adaptation,
  type Block,
  type ChecklistItem,
} from "./rotina";

/** The user-editable content of the three plan tabs. */
export type Plan = { rotina: Block[]; adaptacoes: Adaptation[]; checklist: ChecklistItem[] };

export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const defaultPlan = (): Plan => ({
  rotina: clone(defaultRotina),
  adaptacoes: clone(defaultAdaptacoes),
  checklist: clone(defaultChecklist),
});

export const newId = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const TIME_RE = /^(\d{1,2}):(\d{2})(?:-(\d{1,2}):(\d{2}))?$/;

const toMinutes = (h: string, m: string): number | null => {
  const hh = Number(h), mm = Number(m);
  return hh <= 23 && mm <= 59 ? hh * 60 + mm : null;
};

/** Parses "5:00-5:10" or "22:00". Returns null when the text isn't a valid time or range (end must be after start). */
export function parseTime(text: string): { start: number; end: number | null } | null {
  const m = TIME_RE.exec(text.trim());
  if (!m) return null;
  const start = toMinutes(m[1]!, m[2]!);
  if (start === null) return null;
  if (m[3] === undefined) return { start, end: null };
  const end = toMinutes(m[3], m[4]!);
  return end !== null && end > start ? { start, end } : null;
}

/** Sorts blocks by start time (stable). Unparseable times go last. */
export function sortRotina(blocks: Block[]): Block[] {
  const key = (b: Block) => parseTime(b.time)?.start ?? Number.MAX_SAFE_INTEGER;
  return blocks
    .map((b, i) => ({ b, i }))
    .sort((x, y) => key(x.b) - key(y.b) || x.i - y.i)
    .map(({ b }) => b);
}

/** Returns a Portuguese error message for the first problem found, or null if the plan can be saved. */
export function validatePlan(plan: Plan): string | null {
  if (plan.rotina.length === 0) return "A rotina precisa ter pelo menos um bloco.";
  for (const [i, b] of plan.rotina.entries()) {
    if (!parseTime(b.time)) return `Rotina, linha ${i + 1}: horário inválido. Use 5:00-5:10 (início menor que o fim) ou 22:00.`;
    if (!b.activity.trim()) return `Rotina, linha ${i + 1}: preencha a atividade.`;
  }
  for (const [i, r] of plan.adaptacoes.entries()) {
    if (!r.scenario.trim()) return `Adaptações, linha ${i + 1}: preencha o cenário.`;
  }
  for (const [i, r] of plan.checklist.entries()) {
    if (!r.day.trim()) return `Checklist, linha ${i + 1}: preencha o dia.`;
  }
  return null;
}

const isStr = (v: unknown): v is string => typeof v === "string";
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const uniqueIds = (rows: { id: string }[]) => new Set(rows.map((r) => r.id)).size === rows.length;

function sanitize<T extends { id: string }>(raw: unknown, ok: (r: Record<string, unknown>) => boolean, fallback: T[]): T[] {
  if (!Array.isArray(raw) || !raw.every((r) => isObj(r) && isStr(r["id"]) && ok(r))) return fallback;
  const rows = raw as T[];
  return uniqueIds(rows) ? rows : fallback;
}

/** Rebuilds a plan from untrusted stored JSON; any section that doesn't have the expected shape falls back to the default. */
export function parsePlan(json: string | null): Plan {
  const d = defaultPlan();
  let raw: unknown;
  try { raw = JSON.parse(json ?? "null"); } catch { return d; }
  if (!isObj(raw)) return d;
  return {
    rotina: sanitize<Block>(raw["rotina"], (r) => ["time", "activity", "method", "tip"].every((k) => isStr(r[k])) && tags.includes(r["tag"] as never), d.rotina),
    adaptacoes: sanitize<Adaptation>(raw["adaptacoes"], (r) => ["scenario", "adjustment", "alternative"].every((k) => isStr(r[k])), d.adaptacoes),
    checklist: sanitize<ChecklistItem>(raw["checklist"], (r) => ["day", "action", "duration"].every((k) => isStr(r[k])), d.checklist),
  };
}
