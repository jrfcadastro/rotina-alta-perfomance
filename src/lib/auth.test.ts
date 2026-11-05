import { describe, expect, it } from "vitest";
import {
  authErrorMessage,
  emailToUsername,
  normalizeUsername,
  usernameToEmail,
  validateCredentials,
  validateUsername,
} from "./auth";

describe("auth helpers", () => {
  it("normalizes usernames and maps them to internal e-mails and back", () => {
    expect(normalizeUsername("  Maria.Silva ")).toBe("maria.silva");
    expect(usernameToEmail(" Maria ")).toBe("maria@rotina.app");
    expect(emailToUsername("maria@rotina.app")).toBe("maria");
    expect(emailToUsername("outro@gmail.com")).toBe("outro@gmail.com");
    expect(emailToUsername(undefined)).toBe("");
  });

  it("validates usernames", () => {
    expect(validateUsername("ana")).toBeNull();
    expect(validateUsername("Ana_Souza-1.x")).toBeNull();
    expect(validateUsername("ab")).toMatch(/3 a 20/);
    expect(validateUsername("a".repeat(21))).toMatch(/3 a 20/);
    expect(validateUsername("ana souza")).toMatch(/apenas letras/);
    expect(validateUsername("ana@x.com")).toMatch(/apenas letras/);
  });

  it("validates username + password together", () => {
    expect(validateCredentials({ username: "ana", password: "123456" })).toBeNull();
    expect(validateCredentials({ username: "a", password: "123456" })).toMatch(/usuário/i);
    expect(validateCredentials({ username: "ana", password: "123" })).toMatch(/senha/i);
  });

  it("translates known Supabase errors", () => {
    expect(authErrorMessage("Invalid login credentials")).toMatch(/incorretos/);
    expect(authErrorMessage("A user with this email address has already been registered")).toMatch(/já existe/);
    expect(authErrorMessage("Forbidden: admin only")).toMatch(/permissão/);
    expect(authErrorMessage("something else")).toMatch(/Tente novamente/);
  });
});
