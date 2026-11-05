import { describe, expect, it } from "vitest";
import { defaultPlan, parsePlan, parseTime, sortRotina, validatePlan } from "./plan";

describe("parseTime", () => {
  it("accepts ranges and single times", () => {
    expect(parseTime("5:00-5:10")).toEqual({ start: 300, end: 310 });
    expect(parseTime(" 22:00 ")).toEqual({ start: 1320, end: null });
    expect(parseTime("07:30-09:30")).toEqual({ start: 450, end: 570 });
  });
  it("rejects invalid input", () => {
    for (const bad of ["", "abc", "25:00", "5:60", "5:00-4:00", "5:00-5:00", "5-6", "5:00-"]) {
      expect(parseTime(bad)).toBeNull();
    }
  });
});

describe("validatePlan", () => {
  it("accepts the default plan", () => {
    expect(validatePlan(defaultPlan())).toBeNull();
  });
  it("reports the first problem in Portuguese with the row number", () => {
    const p = defaultPlan();
    p.rotina[2]!.time = "xx";
    expect(validatePlan(p)).toMatch(/Rotina, linha 3: horário inválido/);
    p.rotina[2]!.time = "5:30-6:00";
    p.rotina[1]!.activity = "  ";
    expect(validatePlan(p)).toMatch(/linha 2: preencha a atividade/);
  });
  it("requires at least one block, a scenario and a day", () => {
    const p = defaultPlan();
    p.rotina = [];
    expect(validatePlan(p)).toMatch(/pelo menos um bloco/);
    const q = defaultPlan();
    q.adaptacoes[0]!.scenario = "";
    expect(validatePlan(q)).toMatch(/Adaptações, linha 1/);
    const r = defaultPlan();
    r.checklist[1]!.day = "";
    expect(validatePlan(r)).toMatch(/Checklist, linha 2/);
  });
});

describe("sortRotina", () => {
  it("orders by start time, stable, invalid last", () => {
    const base = defaultPlan().rotina[0]!;
    const mk = (id: string, time: string) => ({ ...base, id, time });
    const sorted = sortRotina([mk("a", "22:00"), mk("b", "6:00-7:00"), mk("c", "bad"), mk("d", "6:00-6:30")]);
    expect(sorted.map((b) => b.id)).toEqual(["b", "d", "a", "c"]);
  });
});

describe("parsePlan", () => {
  it("falls back per section when stored data has the wrong shape", () => {
    const d = defaultPlan();
    const stored = JSON.stringify({
      rotina: [{ id: "1", time: "5:00-6:00", activity: "x", method: "", tip: "", tag: "Foco" }],
      adaptacoes: "nope",
      checklist: [{ id: "1", day: "A", action: "B" }], // missing duration
    });
    const p = parsePlan(stored);
    expect(p.rotina).toHaveLength(1);
    expect(p.adaptacoes).toEqual(d.adaptacoes);
    expect(p.checklist).toEqual(d.checklist);
  });
  it("rejects unknown tags and duplicate ids", () => {
    const d = defaultPlan();
    const row = { id: "1", time: "5:00-6:00", activity: "x", method: "", tip: "" };
    expect(parsePlan(JSON.stringify({ rotina: [{ ...row, tag: "Outra" }] })).rotina).toEqual(d.rotina);
    expect(parsePlan(JSON.stringify({ rotina: [{ ...row, tag: "Foco" }, { ...row, tag: "Foco" }] })).rotina).toEqual(d.rotina);
  });
});
