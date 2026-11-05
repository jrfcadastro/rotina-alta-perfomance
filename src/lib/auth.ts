export type Credentials = { username: string; password: string };

/**
 * Supabase Auth identifies users by e-mail, so each username maps to an internal,
 * never-delivered address. Users only ever see and type the username.
 */
export const EMAIL_DOMAIN = "rotina.app";

export const normalizeUsername = (u: string) => u.trim().toLowerCase();
export const usernameToEmail = (u: string) => `${normalizeUsername(u)}@${EMAIL_DOMAIN}`;
export const emailToUsername = (email: string | undefined) =>
  (email ?? "").endsWith(`@${EMAIL_DOMAIN}`) ? email!.slice(0, -(EMAIL_DOMAIN.length + 1)) : (email ?? "");

/** Returns a Portuguese error message, or null when the username looks valid. */
export function validateUsername(username: string): string | null {
  const u = normalizeUsername(username);
  if (u.length < 3 || u.length > 20) return "O nome de usuário deve ter de 3 a 20 caracteres.";
  if (!/^[a-z0-9._-]+$/.test(u)) return "Use apenas letras, números, ponto, hífen ou sublinhado.";
  return null;
}

export function validatePassword(password: string): string | null {
  return password.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : null;
}

export function validateCredentials({ username, password }: Credentials): string | null {
  return validateUsername(username) ?? validatePassword(password);
}

/** Maps Supabase auth error messages to Portuguese. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Usuário ou senha incorretos.";
  if (m.includes("already") || m.includes("exists")) return "Este nome de usuário já existe.";
  if (m.includes("forbidden")) return "Você não tem permissão para isso.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com o servidor. Tente novamente.";
  return "Não foi possível concluir. Tente novamente.";
}
