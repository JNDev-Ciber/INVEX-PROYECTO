/**
 * Admin del comercio: el dueño (rol "caja") o un "admin".
 * Crea sucursales, asigna usuarios y puede operar en cualquier sucursal.
 * Es solo para la UI: la base valida lo mismo con invex_es_admin().
 */
export function esAdmin(rol?: string | null): boolean {
  return rol === "caja" || rol === "admin";
}
