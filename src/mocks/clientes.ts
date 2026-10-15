import type { ClienteVenta } from "@/shared/types/inventory";
import { DB, clone, delay, fail, nextId, soloFecha } from "@/mocks/db";

export async function getAllClientes(): Promise<ClienteVenta[]> {
  return delay(clone(DB.clientes));
}

export async function agregarCliente(nombre: string, cuit: string, telefono: string) {
  const id = nextId(DB.clientes);
  DB.clientes.push({
    id,
    nombre,
    cuit: cuit || undefined,
    telefono: telefono || undefined,
    saldoPendiente: 0,
  });
  return delay(id);
}

export async function eliminarCliente(clienteId: number) {
  const idx = DB.clientes.findIndex((c) => c.id === clienteId);
  if (idx === -1) fail("Cliente no encontrado");
  DB.clientes.splice(idx, 1);
  DB.ventasFiado = DB.ventasFiado.filter((v) => v.clienteId !== clienteId);
  DB.pagos = DB.pagos.filter((p) => p.cliente_id !== clienteId);
  return delay(true);
}

export async function agregarDeudaDirecta(clienteId: number, monto: number, concepto: string) {
  const cliente = DB.clientes.find((c) => c.id === clienteId);
  if (!cliente) fail("Cliente no encontrado");
  const id = nextId(DB.ventasFiado);
  const ahora = new Date().toISOString();
  DB.ventasFiado.push({
    id,
    clienteId,
    fecha: soloFecha(ahora),
    total: monto,
    saldoPendiente: monto,
    detalles: [
      {
        id: Date.now() + id,
        ventaFiadoId: id,
        productoId: "",
        productoNombre: concepto || "Deuda manual",
        cantidad: 1,
        precioUnitario: monto,
        subtotal: monto,
        pagado: false,
      },
    ],
    createdAt: ahora,
  });
  cliente.saldoPendiente += monto;
  return delay(true);
}

export async function registrarPagoParcial(clienteId: number, monto: number) {
  const cliente = DB.clientes.find((c) => c.id === clienteId);
  if (!cliente) fail("Cliente no encontrado");
  if (monto > cliente.saldoPendiente) fail("El pago supera la deuda del cliente");

  // Se imputa a las ventas más antiguas primero.
  let restante = monto;
  const ventas = DB.ventasFiado
    .filter((v) => v.clienteId === clienteId && v.saldoPendiente > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const v of ventas) {
    if (restante <= 0) break;
    const aplicado = Math.min(v.saldoPendiente, restante);
    v.saldoPendiente -= aplicado;
    restante -= aplicado;
    DB.pagos.push({
      id: nextId(DB.pagos),
      cliente_id: clienteId,
      venta_fiado_id: v.id,
      monto: aplicado,
      fecha: new Date().toISOString(),
    });
  }
  cliente.saldoPendiente -= monto;
  return delay(true);
}

export interface ClienteDeudaVencida {
  id: number;
  nombre: string;
  telefono: string | null;
  deuda_total: number;
  deuda_mas_antigua_sin_pagar: string;
  cantidad_ventas_impagas: number;
  ventas: Array<{
    id: number;
    fecha: string;
    total: number;
    saldo_pendiente: number;
    productos: Array<{
      producto_nombre: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      pagado: boolean;
    }>;
  }>;
}

/** Clientes con ventas a cuenta corriente impagas de más de `diasAtras` días. */
export async function getClientesDeudaVencida(diasAtras: number): Promise<ClienteDeudaVencida[]> {
  const limite = Date.now() - diasAtras * 86_400_000;
  const filas: ClienteDeudaVencida[] = [];
  for (const c of DB.clientes) {
    const vencidas = DB.ventasFiado.filter(
      (v) => v.clienteId === c.id && v.saldoPendiente > 0 && new Date(v.createdAt).getTime() <= limite,
    );
    if (vencidas.length === 0) continue;
    filas.push({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono ?? null,
      deuda_total: vencidas.reduce((s, v) => s + v.saldoPendiente, 0),
      deuda_mas_antigua_sin_pagar: vencidas.reduce((a, v) => (v.createdAt < a ? v.createdAt : a), vencidas[0].createdAt),
      cantidad_ventas_impagas: vencidas.length,
      ventas: vencidas.map((v) => ({
        id: v.id,
        fecha: v.fecha,
        total: v.total,
        saldo_pendiente: v.saldoPendiente,
        productos: v.detalles.map((d) => ({
          producto_nombre: d.productoNombre,
          cantidad: d.cantidad,
          precio_unitario: d.precioUnitario,
          subtotal: d.subtotal,
          pagado: d.pagado,
        })),
      })),
    });
  }
  return delay(filas.sort((a, b) => b.deuda_total - a.deuda_total));
}
