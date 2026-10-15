import type { VentaPorEmpleado } from "@/shared/types/inventory";
import { DB, delay, soloFecha } from "./db";
import { empleadoIdPorUsuario, nombreEmpleadoPorUsuario } from "./empleados";

/** Fecha local YYYY-MM-DD de un ISO. */
function fechaLocalDeIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return soloFecha(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getVentasPorEmpleado(
  fechaInicio: string,
  fechaFin: string,
): Promise<VentaPorEmpleado[]> {
  const inicio = soloFecha(fechaInicio);
  const fin = soloFecha(fechaFin);

  const grupos = new Map<
    string,
    {
      total: number;
      unidades: number;
      ventas: Set<string>;
      metodos: Record<string, number>;
      productos: Map<string, { productoId: string | null; productoNombre: string; cantidad: number; total: number }>;
    }
  >();

  for (const m of DB.movimientos) {
    if (m.type !== "salida" || m.esTransferencia || !m.usuarioId) continue;
    const fecha = fechaLocalDeIso(m.date);
    if (fecha < inicio || fecha > fin) continue;

    let g = grupos.get(m.usuarioId);
    if (!g) {
      g = { total: 0, unidades: 0, ventas: new Set(), metodos: {}, productos: new Map() };
      grupos.set(m.usuarioId, g);
    }
    g.total += m.valor_total;
    g.unidades += m.quantity;
    g.ventas.add(m.ventaId ?? m.id);
    const metodo = m.metodoPago ?? "efectivo";
    g.metodos[metodo] = (g.metodos[metodo] ?? 0) + m.valor_total;
    const clave = m.productId ?? m.productName;
    const p = g.productos.get(clave) ?? {
      productoId: m.productId,
      productoNombre: m.productName || "Producto",
      cantidad: 0,
      total: 0,
    };
    p.cantidad += m.quantity;
    p.total += m.valor_total;
    g.productos.set(clave, p);
  }

  const resultado: VentaPorEmpleado[] = [...grupos.entries()].map(([usuarioId, g]) => {
    const usuario = DB.usuarios.find((u) => u.id === usuarioId);
    return {
      usuarioId,
      empleadoId: empleadoIdPorUsuario(usuarioId),
      nombreMostrado: nombreEmpleadoPorUsuario(usuarioId) ?? usuario?.username ?? "Sin asignar",
      totalVendido: g.total,
      cantidadUnidades: g.unidades,
      cantidadVentas: g.ventas.size,
      porMetodoPago: g.metodos,
      porProducto: [...g.productos.values()].sort((a, b) => b.total - a.total),
    };
  });

  resultado.sort((a, b) => b.totalVendido - a.totalVendido);
  return delay(resultado);
}
