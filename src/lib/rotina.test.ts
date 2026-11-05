import { describe, expect, it } from "vitest";
import { currentBlock, dateKey, minutes, rotina, streak } from "./rotina";

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
    expect(rotina[currentBlock(at(5, 0))]![1]).toContain("Hidratação");
    expect(rotina[currentBlock(at(5, 10))]![1]).toContain("Meditação"); // end exclusive
    expect(rotina[currentBlock(at(8, 0))]![1]).toContain("Foco Profundo #2");
    expect(currentBlock(at(7, 15))).toBe(-1); // gap 7:00-7:30
    expect(rotina[currentBlock(at(22, 30))]![1]).toBe("Dormir");
    expect(rotina[currentBlock(at(3, 0))]![1]).toBe("Dormir"); // wraps past midnight
  });
});
