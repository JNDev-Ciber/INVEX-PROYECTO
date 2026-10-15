import { create } from "zustand";

const STORAGE_KEY = "invex.sucursalActiva";

function leerGuardada(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

interface SucursalStore {
  /** Sucursal elegida por el admin en el header. null = la suya. */
  sucursalElegidaId: string | null;
  setSucursalElegidaId: (id: string | null) => void;
  /**
   * Sucursal en la que opera la app ahora (ya resuelta: la elegida por el
   * admin o la del usuario). La mantiene SucursalSelector y la leen los
   * servicios con sucursalOperacion().
   */
  sucursalOperacionId: string | null;
  setSucursalOperacionId: (id: string | null) => void;
}

export const useSucursalStore = create<SucursalStore>((set) => ({
  sucursalElegidaId: leerGuardada(),
  setSucursalElegidaId: (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // sin storage: la elección dura hasta recargar
    }
    set({ sucursalElegidaId: id });
  },
  sucursalOperacionId: null,
  setSucursalOperacionId: (id) => set({ sucursalOperacionId: id }),
}));

/**
 * Sucursal para mandar en cada RPC (p_sucursal_id). null = que la base use
 * la del usuario. La base valida que un vendedor no opere en otra.
 */
export function sucursalOperacion(): string | null {
  return useSucursalStore.getState().sucursalOperacionId;
}
