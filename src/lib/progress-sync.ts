import type { SupabaseClient } from "@supabase/supabase-js";
import type { DoneMap } from "./storage";

/** Table created by supabase/migrations/20261105130000_user_progress.sql (one row per user and day, protected by RLS). */
const TABLE = "user_progress";
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** day ("YYYY-MM-DD") -> which blocks were done that day. */
export type ProgressMap = Record<string, DoneMap>;

function sanitizeDone(raw: unknown): DoneMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: DoneMap = {};
  for (const [k, v] of Object.entries(raw)) if (v === true) out[k] = true;
  return out;
}

/** Days that exist locally but not on the server yet (these get uploaded; days on the server win over local ones). */
export function daysToUpload(local: ProgressMap, remote: ProgressMap): ProgressMap {
  const out: ProgressMap = {};
  for (const [day, done] of Object.entries(local)) if (!(day in remote) && Object.keys(done).length) out[day] = done;
  return out;
}

/** All of the signed-in user's saved days. Throws if the request fails (e.g. table missing). */
export async function fetchRemoteProgress(db: SupabaseClient, userId: string): Promise<ProgressMap> {
  const { data, error } = await db
    .from(TABLE)
    .select("day, done")
    .eq("user_id", userId)
    .order("day", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  const out: ProgressMap = {};
  for (const row of (data ?? []) as { day: unknown; done: unknown }[]) {
    if (typeof row.day === "string" && DAY_RE.test(row.day)) out[row.day] = sanitizeDone(row.done);
  }
  return out;
}

/** Saves (insert or update) one or more days. Throws if the request fails. */
export async function pushRemoteProgress(db: SupabaseClient, userId: string, days: ProgressMap): Promise<void> {
  const updated_at = new Date().toISOString();
  const rows = Object.entries(days)
    .filter(([day]) => DAY_RE.test(day))
    .map(([day, done]) => ({ user_id: userId, day, done: sanitizeDone(done), updated_at }));
  if (!rows.length) return;
  const { error } = await db.from(TABLE).upsert(rows, { onConflict: "user_id,day" });
  if (error) throw new Error(error.message);
}
