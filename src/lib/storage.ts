import { minutes, rotina } from "./rotina";

/** Minimal Storage surface so the logic is testable without a browser. */
export type KV = Pick<Storage, "getItem" | "setItem" | "length" | "key">;

export const DONE_PREFIX = "rap-done-";
export type DoneMap = Record<number, boolean>;

const countDone = (m: DoneMap) => Object.values(m).filter(Boolean).length;

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

export { countDone };

/** Minutes of "Foco" blocks done vs total. */
export function focusTotals(done: DoneMap): { total: number; got: number } {
  let total = 0, got = 0;
  rotina.forEach(([h, , , , t], i) => {
    if (t === "Foco") { total += minutes(h); if (done[i]) got += minutes(h); }
  });
  return { total, got };
}
