import type { PlanTier } from "@/features/dashboard/sections/registry";
import { DB, delay, readSessionUserId, writeSessionUserId, type UsuarioDb } from "@/mocks/db";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string | number;
  username: string;
  rol: string;
}

function toAuthUser(u: UsuarioDb): AuthUser {
  return { id: u.id, username: u.username, rol: u.rol };
}

export async function loginWithCredentials({ username, password }: LoginCredentials): Promise<AuthUser> {
  const nombre = username.toLowerCase().trim();
  const user = DB.usuarios.find((u) => u.username === nombre && u.password === password);
  await delay(null, 250);
  if (!user) throw new Error("Usuario o contraseña incorrectos");
  writeSessionUserId(user.id);
  return toAuthUser(user);
}

export async function logoutUser(): Promise<void> {
  writeSessionUserId(null);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const id = readSessionUserId();
  const user = DB.usuarios.find((u) => u.id === id);
  return user ? toAuthUser(user) : null;
}

/** La demo siempre corre con el plan completo. */
export async function obtenerPlan(): Promise<PlanTier> {
  return "ia";
}
