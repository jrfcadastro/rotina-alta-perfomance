import { describe, expect, it } from "vitest";
import { dateKey, minutes, streak } from "./rotina";

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
});
