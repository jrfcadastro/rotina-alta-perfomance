import { beforeEach, describe, expect, it } from "vitest";
import { countDone, focusTotals, loadCounts, loadDone, loadPlan, saveDone, savePlan } from "./storage";
import { defaultRotina } from "./rotina";
import { defaultPlan } from "./plan";

beforeEach(() => localStorage.clear());

describe("storage", () => {
  it("round-trips a day's checklist", () => {
    saveDone(localStorage, "2026-11-05", { "0": true, "3": true, "4": false });
    expect(loadDone(localStorage, "2026-11-05")).toEqual({ "0": true, "3": true, "4": false });
    expect(loadDone(localStorage, "2026-11-06")).toEqual({});
  });

  it("treats corrupted or non-object data as empty", () => {
    for (const bad of ["{not json", "[1,2]", "null", "42"]) {
      localStorage.setItem("rap-done-2026-11-05", bad);
      expect(loadDone(localStorage, "2026-11-05")).toEqual({});
    }
  });

  it("loadCounts skips corrupted/empty entries and unrelated keys", () => {
    saveDone(localStorage, "2026-11-03", { "1": true, "2": true });
    saveDone(localStorage, "2026-11-04", { "1": false });
    localStorage.setItem("rap-done-2026-11-02", "garbage");
    localStorage.setItem("rap-tab", "2");
    expect(loadCounts(localStorage)).toEqual({ "2026-11-03": 2 });
  });

  it("countDone counts only true values, ignoring removed blocks when ids are given", () => {
    expect(countDone({ "0": true, "1": false, "2": true })).toBe(2);
    expect(countDone({})).toBe(0);
    expect(countDone({ "0": true, "2": true, gone: true }, ["0", "1", "2"])).toBe(2);
  });

  it("focusTotals sums only Foco blocks", () => {
    const focus = defaultRotina.filter((b) => b.tag === "Foco");
    const other = defaultRotina.find((b) => b.tag !== "Foco")!;
    const empty = focusTotals({}, defaultRotina);
    expect(empty.got).toBe(0);
    expect(empty.total).toBeGreaterThan(0);
    expect(focusTotals({ [other.id]: true }, defaultRotina).got).toBe(0);
    const all = Object.fromEntries(focus.map((b) => [b.id, true]));
    expect(focusTotals(all, defaultRotina).got).toBe(empty.total);
  });

  it("old index-keyed checklists still match default block ids", () => {
    expect(defaultRotina.map((b) => b.id)).toEqual(defaultRotina.map((_, i) => String(i)));
  });

  it("loadPlan returns defaults when nothing or garbage is stored, and round-trips edits", () => {
    expect(loadPlan(localStorage)).toEqual(defaultPlan());
    localStorage.setItem("rap-plan-v1", "{oops");
    expect(loadPlan(localStorage)).toEqual(defaultPlan());
    const p = defaultPlan();
    p.rotina[0]!.time = "4:30-4:45";
    p.checklist.push({ id: "x1", day: "Quarta", action: "Revisão", duration: "15min" });
    savePlan(localStorage, p);
    expect(loadPlan(localStorage)).toEqual(p);
  });
});
