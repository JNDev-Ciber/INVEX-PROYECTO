/**
 * Formatea una fecha para mostrar, evitando el corrimiento de -1 día que
 * produce `new Date("YYYY-MM-DD").toLocaleDateString()` en husos horarios
 * detrás de UTC (Argentina, UTC-3): un string sin hora se interpreta como
 * medianoche UTC, y al convertir a hora local cae en el día anterior.
 */
export function formatFechaLocal(
  fecha: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!fecha) return "";
  if (fecha instanceof Date) return fecha.toLocaleDateString("es-AR", options);

  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (soloFecha) {
    const [, y, m, d] = soloFecha;
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("es-AR", options);
  }

  return new Date(fecha).toLocaleDateString("es-AR", options);
}
