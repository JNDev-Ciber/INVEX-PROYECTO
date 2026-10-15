import type { Pago, VentaFiado } from "@/shared/types/inventory";
import { DB, clone, delay, fail, nextId, sucursalActualId, soloFecha } from "@/mocks/db";
import { aplicarSalidaStock } from "@/mocks/movements";

export async function getVentasFiado(): Promise<VentaFiado[]> {
  return delay(clone(DB.ventasFiado));
}

export interface VentaFiadoAtribucion {
  usuarioId?: string | number | null;
  usuarioNombre?: string | null;
}

export async function agregarVentaFiado(
  clienteId: number,
  productos: Array<{ productoId: string; cantidad: number }>,
  atribucion?: VentaFiadoAtribucion,
) {
  const cliente = DB.clientes.find((c) => c.id === clienteId);
  if (!cliente) fail("Cliente no encontrado");
  if (productos.length === 0) fail("La venta no tiene productos");

  const id = nextId(DB.ventasFiado);
  const ahora = new Date().toISOString();
  const sucursalId = sucursalActualId();
  let detalleId = Date.now();
  const detalles = productos.map(({ productoId, cantidad }) => {
    const prod = DB.productos.find((p) => p.id === productoId);
    if (!prod) fail("Producto no encontrado");
    aplicarSalidaStock({
      producto: prod,
      cantidad,
      sucursalId,
      motivo: `Venta a cuenta corriente - ${cliente.nombre}`,
      precio: prod.price,
      metodoPago: "cuenta_corriente",
      usuarioId: atribucion?.usuarioId ? String(atribucion.usuarioId) : null,
      usuarioNombre: atribucion?.usuarioNombre ?? null,
      clienteId,
      ventaId: `fiado-${id}`,
    });
    return {
      id: detalleId++,
      ventaFiadoId: id,
      productoId: prod.id,
      productoNombre: prod.name,
      cantidad,
      precioUnitario: prod.price,
      subtotal: prod.price * cantidad,
      pagado: false,
    };
  });
  const total = detalles.reduce((s, d) => s + d.subtotal, 0);
  DB.ventasFiado.push({
    id,
    clienteId,
    fecha: soloFecha(ahora),
    total,
    saldoPendiente: total,
    detalles,
    createdAt: ahora,
  });
  cliente.saldoPendiente += total;
  return delay({ success: true, ventaId: id });
}

export async function marcarProductosPagados(detalleIds: number[], ventaId: number) {
  const venta = DB.ventasFiado.find((v) => v.id === ventaId);
  if (!venta) fail("Venta no encontrada");
  const ahora = new Date().toISOString();
  let pagado = 0;
  for (const d of venta.detalles) {
    if (detalleIds.includes(d.id) && !d.pagado) {
      d.pagado = true;
      d.pagadoEn = ahora;
      pagado += d.subtotal;
    }
  }
  venta.saldoPendiente = Math.max(0, venta.saldoPendiente - pagado);
  const cliente = DB.clientes.find((c) => c.id === venta.clienteId);
  if (cliente) cliente.saldoPendiente = Math.max(0, cliente.saldoPendiente - pagado);
  if (pagado > 0) {
    DB.pagos.push({ id: nextId(DB.pagos), cliente_id: venta.clienteId, venta_fiado_id: ventaId, monto: pagado, fecha: ahora });
  }
  return delay(true);
}

export async function getPagos(): Promise<Pago[]> {
  return delay(clone(DB.pagos));
}
