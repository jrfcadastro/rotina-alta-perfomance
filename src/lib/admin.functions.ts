// Server functions for user administration. Handlers run on the server only;
// server-only modules are imported dynamically inside them so they never reach the client bundle.
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_DOMAIN, emailToUsername, normalizeUsername, usernameToEmail, validatePassword, validateUsername } from "./auth";

/** Client side: attach the logged-in user's access token to every call. */
const attachToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

/** Server side: the caller must be authenticated AND have app_metadata.role === "admin" (checked against the auth DB, not the token). */
const requireAdmin = createMiddleware({ type: "function" })
  .middleware([attachToken, requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (error || data.user?.app_metadata?.["role"] !== "admin") throw new Error("Forbidden: admin only");
    return next({ context: { supabaseAdmin, adminId: context.userId } });
  });

export type AppUser = { id: string; username: string; role: "admin" | "user"; createdAt: string };

/**
 * Creates the admin account from the ADMIN_USERNAME / ADMIN_PASSWORD secrets if it doesn't exist yet.
 * Idempotent and takes no input, so calling it from the login screen is safe.
 */
export const ensureAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const username = process.env["ADMIN_USERNAME"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!username || !password || validateUsername(username) || validatePassword(password)) return { ok: false as const };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username: normalizeUsername(username) },
    app_metadata: { role: "admin" },
  });
  if (error && !/already|exists/i.test(error.message)) {
    console.error("[ensureAdmin]", error.message);
    return { ok: false as const };
  }
  return { ok: true as const };
});

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async ({ context }): Promise<AppUser[]> => {
    const { data, error } = await context.supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    return data.users
      .filter((u) => u.email?.endsWith(`@${EMAIL_DOMAIN}`))
      .map((u) => ({
        id: u.id,
        username: emailToUsername(u.email),
        role: u.app_metadata?.["role"] === "admin" ? ("admin" as const) : ("user" as const),
        createdAt: u.created_at,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  });

const createInput = z.object({ username: z.string().max(40), password: z.string().min(1).max(72) });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(createInput)
  .handler(async ({ context, data }) => {
    const invalid = validateUsername(data.username) ?? validatePassword(data.password);
    if (invalid) throw new Error(invalid);
    const { error } = await context.supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
      user_metadata: { username: normalizeUsername(data.username) },
      app_metadata: { role: "user" },
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    if (data.id === context.adminId) throw new Error("Você não pode excluir a si mesmo.");
    const { error } = await context.supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
