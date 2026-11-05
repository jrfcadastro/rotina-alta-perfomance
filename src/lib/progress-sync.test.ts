import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { daysToUpload, fetchRemoteProgress, pushRemoteProgress } from "./progress-sync";
import { clearUserData, loadAllDone, saveDone, savePlan } from "./storage";
import { defaultPlan } from "./plan";

type Calls = { table?: string; eq?: [string, string]; order?: unknown; upserted?: unknown; opts?: unknown };

function fakeDb(result: { data?: unknown; error?: { message: string } | null }, calls: Calls = {}) {
  return {
    from: (table: string) => {
      calls.table = table;
      return {
        select: () => ({
          eq: (col: string, val: string) => {
            calls.eq = [col, val];
            return {
              order: (...o: unknown[]) => {
                calls.order = o;
                return { limit: async () => ({ data: result.data ?? [], error: result.error ?? null }) };
              },
            };
          },
        }),
        upsert: async (rows: unknown, opts: unknown) => {
          calls.upserted = rows;
          calls.opts = opts;
          return { error: result.error ?? null };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("progress sync", () => {
  it("daysToUpload returns only non-empty local days missing on the server", () => {
    const local = { "2026-11-03": { "0": true }, "2026-11-04": { "1": true }, "2026-11-05": {} };
    const remote = { "2026-11-04": { "2": true } };
    expect(daysToUpload(local, remote)).toEqual({ "2026-11-03": { "0": true } });
  });

  it("fetchRemoteProgress maps rows by day and sanitizes bad data", async () => {
    const calls: Calls = {};
    const rows = [
      { day: "2026-11-05", done: { "0": true, "1": false, "2": "yes" } },
      { day: "not-a-date", done: { "0": true } },
      { day: "2026-11-04", done: "garbage" },
    ];
    expect(await fetchRemoteProgress(fakeDb({ data: rows }, calls), "u1")).toEqual({
      "2026-11-05": { "0": true },
      "2026-11-04": {},
    });
    expect(calls.table).toBe("user_progress");
    expect(calls.eq).toEqual(["user_id", "u1"]);
  });

  it("upserts days keyed by user and day, skipping invalid days", async () => {
    const calls: Calls = {};
    await pushRemoteProgress(fakeDb({}, calls), "u1", { "2026-11-05": { "0": true }, bad: { "1": true } });
    expect(calls.upserted).toMatchObject([{ user_id: "u1", day: "2026-11-05", done: { "0": true } }]);
    expect(calls.upserted).toHaveLength(1);
    expect(calls.opts).toEqual({ onConflict: "user_id,day" });
  });

  it("does nothing when there is nothing to push, and throws on request errors", async () => {
    const calls: Calls = {};
    await pushRemoteProgress(fakeDb({}, calls), "u1", {});
    expect(calls.table).toBeUndefined();
    await expect(fetchRemoteProgress(fakeDb({ error: { message: "no table" } }), "u1")).rejects.toThrow(/no table/);
    await expect(pushRemoteProgress(fakeDb({ error: { message: "denied" } }), "u1", { "2026-11-05": { "0": true } })).rejects.toThrow(/denied/);
  });
});

describe("local user data", () => {
  beforeEach(() => localStorage.clear());

  it("loadAllDone lists non-empty days and skips corrupted ones", () => {
    saveDone(localStorage, "2026-11-03", { "0": true });
    saveDone(localStorage, "2026-11-04", { "0": false });
    localStorage.setItem("rap-done-2026-11-02", "garbage");
    expect(loadAllDone(localStorage)).toEqual({ "2026-11-03": { "0": true } });
  });

  it("clearUserData removes progress and plan but keeps UI preferences", () => {
    saveDone(localStorage, "2026-11-03", { "0": true });
    savePlan(localStorage, defaultPlan());
    localStorage.setItem("rap-dark", "0");
    localStorage.setItem("rap-tab", "2");
    clearUserData(localStorage);
    expect(loadAllDone(localStorage)).toEqual({});
    expect(localStorage.getItem("rap-plan-v1")).toBeNull();
    expect(localStorage.getItem("rap-dark")).toBe("0");
    expect(localStorage.getItem("rap-tab")).toBe("2");
  });
});
