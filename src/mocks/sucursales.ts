import { DB, currentUser, delay, fail, stockEn, uid } from "./db";

export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  punto_venta_arca: number | null;
  es_principal: boolean;
  activa: boolean;
  usuarios: number;
  unidades_stock: number;
}

export interface MiSucursal {
  id: string;
  nombre: string;
  es_principal: boolean;
}

function toSucursal(s: (typeof DB.sucursales)[number]): Sucursal {
  return {
    ...s,
    usuarios: DB.usuarios.filter((u) => u.sucursal_id === s.id).length,
    unidades_stock: DB.productos.reduce((acc, p) => acc + stockEn(p, s.id), 0),
  };
}

export async function getSucursales(): Promise<Sucursal[]> {
  const lista = [...DB.sucursales]
    .sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.nombre.localeCompare(b.nombre))
    .map(toSucursal);
  return delay(lista);
}

export async function getMiSucursal(): Promise<MiSucursal | null> {
  const sucId = currentUser()?.sucursal_id;
  const s = DB.sucursales.find((x) => x.id === sucId);
  return delay(s ? { id: s.id, nombre: s.nombre, es_principal: s.es_principal } : null);
}

export async function crearSucursal(payload: {
  nombre: string;
  direccion?: string;
  telefono?: string;
}): Promise<string> {
  const nombre = payload.nombre?.trim();
  if (!nombre) fail("El nombre de la sucursal es obligatorio");
  if (DB.sucursales.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
    fail("Ya existe una sucursal con ese nombre");
  }
  const id = uid("suc");
  const maxPv = DB.sucursales.reduce((m, s) => Math.max(m, s.punto_venta_arca ?? 0), 0);
  DB.sucursales.push({
    id,
    nombre,
    direccion: payload.direccion ?? null,
    telefono: payload.telefono ?? null,
    punto_venta_arca: maxPv + 1,
    es_principal: false,
    activa: true,
  });
  // La nueva sucursal arranca sin stock.
  for (const p of DB.productos) p.stock[id] = 0;
  return delay(id);
}

export async function editarSucursal(payload: {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  activa: boolean;
}): Promise<void> {
  const s = DB.sucursales.find((x) => x.id === payload.id) ?? fail("Sucursal no encontrada");
  const nombre = payload.nombre?.trim();
  if (!nombre) fail("El nombre de la sucursal es obligatorio");
  if (s.es_principal && !payload.activa) fail("No se puede desactivar la sucursal principal");
  s.nombre = nombre;
  s.direccion = payload.direccion;
  s.telefono = payload.telefono;
  s.activa = payload.activa;
  return delay(undefined);
}

export async function asignarSucursalUsuario(userId: string, sucursalId: string): Promise<void> {
  const u = DB.usuarios.find((x) => x.id === userId) ?? fail("Usuario no encontrado");
  if (!DB.sucursales.some((s) => s.id === sucursalId)) fail("Sucursal no encontrada");
  u.sucursal_id = sucursalId;
  return delay(undefined);
}
