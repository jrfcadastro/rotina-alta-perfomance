import type { SupabaseClient } from "@supabase/supabase-js";
import { parsePlan, type Plan } from "./plan";

/** Table created by supabase/migrations/20261105120000_user_plans.sql (one row per user, protected by RLS). */
const TABLE = "user_plans";

/** The signed-in user's saved plan, or null if they never saved one. Throws if the request fails (e.g. table missing). */
export async function fetchRemotePlan(db: SupabaseClient, userId: string): Promise<Plan | null> {
  const { data, error } = await db.from(TABLE).select("plan").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? parsePlan(JSON.stringify((data as { plan: unknown }).plan)) : null;
}

/** Saves (insert or update) the user's plan. Throws if the request fails. */
export async function pushRemotePlan(db: SupabaseClient, userId: string, plan: Plan): Promise<void> {
  const { error } = await db.from(TABLE).upsert({ user_id: userId, plan, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
