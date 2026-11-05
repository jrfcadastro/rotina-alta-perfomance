import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRemotePlan, pushRemotePlan } from "./plan-sync";
import { defaultPlan } from "./plan";

type Calls = { table?: string; eq?: [string, string]; upserted?: Record<string, unknown> };

function fakeDb(result: { data?: unknown; error?: { message: string } | null }, calls: Calls = {}) {
  return {
    from: (table: string) => {
      calls.table = table;
      return {
        select: () => ({
          eq: (col: string, val: string) => {
            calls.eq = [col, val];
            return { maybeSingle: async () => ({ data: result.data ?? null, error: result.error ?? null }) };
          },
        }),
        upsert: async (row: Record<string, unknown>) => {
          calls.upserted = row;
          return { error: result.error ?? null };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("plan sync", () => {
  it("returns null when the user has no saved plan", async () => {
    const calls: Calls = {};
    expect(await fetchRemotePlan(fakeDb({ data: null }, calls), "u1")).toBeNull();
    expect(calls.table).toBe("user_plans");
    expect(calls.eq).toEqual(["user_id", "u1"]);
  });

  it("returns the stored plan, sanitized", async () => {
    const p = defaultPlan();
    p.rotina[0]!.time = "4:30-4:45";
    expect(await fetchRemotePlan(fakeDb({ data: { plan: p } }), "u1")).toEqual(p);
    // garbage in the column falls back to defaults instead of crashing
    expect(await fetchRemotePlan(fakeDb({ data: { plan: "oops" } }), "u1")).toEqual(defaultPlan());
  });

  it("throws on request errors so the UI can show 'not synced'", async () => {
    await expect(fetchRemotePlan(fakeDb({ error: { message: "relation does not exist" } }), "u1")).rejects.toThrow(/does not exist/);
    await expect(pushRemotePlan(fakeDb({ error: { message: "denied" } }), "u1", defaultPlan())).rejects.toThrow(/denied/);
  });

  it("upserts the plan keyed by user id", async () => {
    const calls: Calls = {};
    const p = defaultPlan();
    await pushRemotePlan(fakeDb({}, calls), "u1", p);
    expect(calls.upserted).toMatchObject({ user_id: "u1", plan: p });
    expect(typeof calls.upserted!["updated_at"]).toBe("string");
  });
});
