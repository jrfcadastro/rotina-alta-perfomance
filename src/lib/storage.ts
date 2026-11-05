import { minutes, type Block } from "./rotina";
import { parsePlan, type Plan } from "./plan";

/** Minimal Storage surface so the logic is testable without a browser. */
export type KV = Pick<Storage, "getItem" | "setItem" | "length" | "key"> & Partial<Pick<Storage, "removeItem">>;

export const DONE_PREFIX = "rap-done-";
export const PLAN_KEY = "rap-plan-v1";
/** Block id -> done. Default blocks use their original index as id, so older saved days still match. */
export type DoneMap = Record<string, boolean>;

/** Number of blocks done. When `ids` is given, blocks that no longer exist in the plan are ignored. */
export function countDone(m: DoneMap, ids?: readonly string[]): number {
  return ids ? ids.filter((id) => m[id]).length : Object.values(m).filter(Boolean).length;
}

function parseDone(raw: string | null): DoneMap {
  try {
    const v: unknown = JSON.parse(raw ?? "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? (v as DoneMap) : {};
  } catch {
    return {};
  }
}

/** Checklist for one day ("YYYY-MM-DD"); corrupted or missing data yields {}. */
export function loadDone(kv: KV, day: string): DoneMap {
  return parseDone(kv.getItem(DONE_PREFIX + day));
}

export function saveDone(kv: KV, day: string, done: DoneMap): void {
  kv.setItem(DONE_PREFIX + day, JSON.stringify(done));
}

/** day -> number of blocks done, for every stored day that has at least one. Corrupted entries are skipped. */
export function loadCounts(kv: KV): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < kv.length; i++) {
    const k = kv.key(i);
    if (!k?.startsWith(DONE_PREFIX)) continue;
    const n = countDone(parseDone(kv.getItem(k)));
    if (n > 0) out[k.slice(DONE_PREFIX.length)] = n;
  }
  return out;
}

/** Every stored day with at least one block done, as day -> DoneMap. Corrupted entries are skipped. */
export function loadAllDone(kv: KV): Record<string, DoneMap> {
  const out: Record<string, DoneMap> = {};
  for (let i = 0; i < kv.length; i++) {
    const k = kv.key(i);
    if (!k?.startsWith(DONE_PREFIX)) continue;
    const m = parseDone(kv.getItem(k));
    if (countDone(m) > 0) out[k.slice(DONE_PREFIX.length)] = m;
  }
  return out;
}

/** Removes the per-user data (daily progress and plan) so the next person to sign in on this browser starts clean. */
export function clearUserData(kv: KV): void {
  const keys: string[] = [];
  for (let i = 0; i < kv.length; i++) {
    const k = kv.key(i);
    if (k && (k.startsWith(DONE_PREFIX) || k === PLAN_KEY)) keys.push(k);
  }
  keys.forEach((k) => kv.removeItem?.(k));
}

/** Minutes of "Foco" blocks done vs total. */
export function focusTotals(done: DoneMap, blocks: readonly Block[]): { total: number; got: number } {
  let total = 0, got = 0;
  for (const b of blocks) {
    if (b.tag !== "Foco") continue;
    const m = minutes(b.time);
    total += m;
    if (done[b.id]) got += m;
  }
  return { total, got };
}

/** The saved plan, or the default plan when nothing (valid) is stored. */
export function loadPlan(kv: KV): Plan {
  return parsePlan(kv.getItem(PLAN_KEY));
}

export function savePlan(kv: KV, plan: Plan): void {
  kv.setItem(PLAN_KEY, JSON.stringify(plan));
}
