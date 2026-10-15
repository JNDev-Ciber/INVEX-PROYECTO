import type { Segmento, TipoSeguimiento } from "@/mocks/crm";

export const SEGMENTOS: Record<Segmento, { label: string; descripcion: string; clase: string }> = {
  frecuente: {
    label: "Frecuente",
    descripcion: "3 o más compras en los últimos 90 días",
    clase: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  nuevo: {
    label: "Nuevo",
    descripcion: "Primera compra en los últimos 30 días",
    clase: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  ocasional: {
    label: "Ocasional",
    descripcion: "Compró en los últimos 60 días",
    clase: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  },
  inactivo: {
    label: "Inactivo",
    descripcion: "Más de 60 días sin comprar",
    clase: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  sin_compras: {
    label: "Sin compras",
    descripcion: "Todavía no tiene compras registradas",
    clase: "bg-muted text-muted-foreground",
  },
};

export const TIPOS_SEGUIMIENTO: Record<TipoSeguimiento, string> = {
  nota: "Nota",
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  visita: "Visita",
  tarea: "Tarea",
};

export const formatPesos = (valor: number) =>
  valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/** Fecha de hoy (hora local) como YYYY-MM-DD, para inputs de tipo date. */
export function hoyISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Link de WhatsApp para un teléfono argentino cargado a mano
 * ("351 555-1234", "0351 15 555 1234", "+54 9 351..."). Null si no alcanza.
 */
export function linkWhatsApp(telefono: string | null | undefined): string | null {
  let d = (telefono ?? "").replace(/\D/g, "");
  if (d.length < 8) return null;
  if (!d.startsWith("54")) {
    d = d.replace(/^0/, "");
    // Área + número son 10 dígitos; con el 15 de los celulares (después del
    // código de área, de 2 a 4 dígitos) son 12.
    if (d.length === 12) d = d.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");
    d = `549${d}`;
  }
  return `https://wa.me/${d}`;
}
