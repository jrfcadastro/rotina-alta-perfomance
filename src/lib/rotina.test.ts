import { describe, expect, it } from "vitest";
import { currentBlock, dateKey, lastDays, minutes, defaultRotina, streak } from "./rotina";

describe("rotina", () => {
  it("counts minutes in a range", () => {
    expect(minutes("7:30-9:30")).toBe(120);
    expect(minutes("22:00")).toBe(0);
  });
  it("dateKey uses local date", () => {
    expect(dateKey(new Date(2026, 10, 5, 23, 30))).toBe("2026-11-05");
  });
  it("streak counts consecutive days with tasks", () => {
    const days = new Set(["2026-11-05", "2026-11-04", "2026-11-02"]);
    expect(streak(days, new Date(2026, 10, 5, 23, 30))).toBe(2);
    expect(streak(new Set(["2026-11-04"]), new Date(2026, 10, 5, 23, 30))).toBe(1);
  });
  it("currentBlock finds the running block", () => {
    const at = (h: number, m: number) => new Date(2026, 10, 5, h, m);
    expect(defaultRotina[currentBlock(at(5, 0))]!.activity).toContain("Hidratação");
    expect(defaultRotina[currentBlock(at(5, 10))]!.activity).toContain("Meditação"); // end exclusive
    expect(defaultRotina[currentBlock(at(8, 0))]!.activity).toContain("Foco Profundo #2");
    expect(currentBlock(at(7, 15))).toBe(-1); // gap 7:00-7:30
    expect(defaultRotina[currentBlock(at(22, 30))]!.activity).toBe("Dormir");
    expect(defaultRotina[currentBlock(at(3, 0))]!.activity).toBe("Dormir"); // wraps past midnight
  });
  it("lastDays returns n local days, oldest first", () => {
    const d = lastDays(new Date(2026, 10, 2, 23, 30), 7).map((x) => x.key);
    expect(d).toEqual(["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });
});
