import { DB, currentUser, delay, fail, uid, type UsuarioDb } from "./db";

export interface Usuario {
  id: string;
  username: string;
  rol: string;
  sucursal_id: string | null;
  sucursal_nombre: string | null;
}

/** Nunca expone la contraseña. */
function toUsuario(u: UsuarioDb): Usuario {
  return {
    id: u.id,
    username: u.username,
    rol: u.rol,
    sucursal_id: u.sucursal_id,
    sucursal_nombre: DB.sucursales.find((s) => s.id === u.sucursal_id)?.nombre ?? null,
  };
}

export async function getUsuarios(): Promise<Usuario[]> {
  return delay(DB.usuarios.map(toUsuario));
}

export async function createUsuario(payload: {
  username: string;
  password: string;
  rol: string;
  sucursalId?: string | null;
}): Promise<Usuario> {
  const username = payload.username?.trim();
  if (!username) fail("El nombre de usuario es obligatorio");
  if (!payload.password) fail("La contraseña es obligatoria");
  if (DB.usuarios.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    fail("Ya existe un usuario con ese nombre");
  }
  const sucursalId = payload.sucursalId ?? null;
  if (sucursalId && !DB.sucursales.some((s) => s.id === sucursalId)) fail("Sucursal no encontrada");
  const nuevo: UsuarioDb = {
    id: uid("usr"),
    username,
    password: payload.password,
    rol: payload.rol,
    sucursal_id: sucursalId,
  };
  DB.usuarios.push(nuevo);
  return delay(toUsuario(nuevo));
}

export async function deleteUsuario(id: string): Promise<void> {
  if (currentUser()?.id === id) fail("No podés eliminar tu propio usuario");
  const idx = DB.usuarios.findIndex((u) => u.id === id);
  if (idx < 0) fail("Usuario no encontrado");
  DB.usuarios.splice(idx, 1);
  return delay(undefined);
}

export async function updateUsuarioRol(id: string, rol: string): Promise<void> {
  const u = DB.usuarios.find((x) => x.id === id) ?? fail("Usuario no encontrado");
  u.rol = rol;
  return delay(undefined);
}
