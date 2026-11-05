import { beforeEach, describe, expect, it } from "vitest";
import { countDone, focusTotals, loadCounts, loadDone, saveDone } from "./storage";
import { rotina } from "./rotina";

beforeEach(() => localStorage.clear());

describe("storage", () => {
  it("round-trips a day's checklist", () => {
    saveDone(localStorage, "2026-11-05", { 0: true, 3: true, 4: false });
    expect(loadDone(localStorage, "2026-11-05")).toEqual({ 0: true, 3: true, 4: false });
    expect(loadDone(localStorage, "2026-11-06")).toEqual({});
  });

  it("treats corrupted or non-object data as empty", () => {
    for (const bad of ["{not json", "[1,2]", "null", "42"]) {
      localStorage.setItem("rap-done-2026-11-05", bad);
      expect(loadDone(localStorage, "2026-11-05")).toEqual({});
    }
  });

  it("loadCounts skips corrupted/empty entries and unrelated keys", () => {
    saveDone(localStorage, "2026-11-03", { 1: true, 2: true });
    saveDone(localStorage, "2026-11-04", { 1: false });
    localStorage.setItem("rap-done-2026-11-02", "garbage");
    localStorage.setItem("rap-tab", "2");
    expect(loadCounts(localStorage)).toEqual({ "2026-11-03": 2 });
  });

  it("countDone counts only true values", () => {
    expect(countDone({ 0: true, 1: false, 2: true })).toBe(2);
    expect(countDone({})).toBe(0);
  });

  it("focusTotals sums only Foco blocks", () => {
    const focusIdx = rotina.map((r, i) => (r[4] === "Foco" ? i : -1)).filter((i) => i >= 0);
    const otherIdx = rotina.findIndex((r) => r[4] !== "Foco");
    const empty = focusTotals({});
    expect(empty.got).toBe(0);
    expect(empty.total).toBeGreaterThan(0);
    expect(focusTotals({ [otherIdx]: true }).got).toBe(0);
    const all = Object.fromEntries(focusIdx.map((i) => [i, true]));
    expect(focusTotals(all).got).toBe(empty.total);
  });
});
