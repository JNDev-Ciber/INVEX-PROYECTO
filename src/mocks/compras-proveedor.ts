import type { CompraProveedor, PagoProveedor } from "@/shared/types/inventory";
import { DB, clone, delay, fail, sucursalActualId, stockEn, uid } from "@/mocks/db";

export interface ProductoCompra {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export async function getComprasProveedor(proveedorId: string): Promise<CompraProveedor[]> {
  return delay(
    clone(
      DB.comprasProveedor
        .filter((c) => c.proveedorId === proveedorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  );
}

export async function agregarCompraConProductos(
  proveedorId: string,
  productos: ProductoCompra[],
  concepto?: string,
) {
  const proveedor = DB.proveedores.find((p) => p.id === proveedorId);
  if (!proveedor) fail("Proveedor no encontrado");
  if (productos.length === 0) fail("La compra no tiene productos");

  const sucursalId = sucursalActualId();
  const ahora = new Date().toISOString();
  const compraId = uid("compra");

  for (const it of productos) {
    const prod = DB.productos.find((p) => p.id === it.producto_id);
    if (!prod) fail(`Producto no encontrado: ${it.nombre}`);
    const antes = stockEn(prod, sucursalId);
    prod.stock[sucursalId] = antes + it.cantidad;
    prod.cost = it.precio_unitario;
    DB.movimientos.unshift({
      id: uid("mov"),
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      type: "entrada",
      esTransferencia: false,
      quantity: it.cantidad,
      reason: `Compra a ${proveedor.nombre}`,
      date: ahora,
      previousQuantity: antes,
      newQuantity: antes + it.cantidad,
      valor_total: it.precio_unitario * it.cantidad,
      metodoPago: null,
      usuarioId: null,
      usuarioNombre: null,
      sucursalId,
      clienteId: null,
      ventaId: null,
    });
  }

  const total = productos.reduce((s, it) => s + it.cantidad * it.precio_unitario, 0);
  DB.comprasProveedor.push({
    id: compraId,
    proveedorId,
    fecha: ahora.slice(0, 10),
    total,
    saldoPendiente: total,
    concepto: concepto || undefined,
    detalles: productos.map((it) => ({
      productoId: it.producto_id,
      nombre: it.nombre,
      cantidad: it.cantidad,
      precioUnitario: it.precio_unitario,
    })),
    createdAt: ahora,
  });
  proveedor.saldoPendiente += total;
  return delay({ success: true, compraId });
}

export async function getPagosProveedor(proveedorId: string): Promise<PagoProveedor[]> {
  return delay(
    clone(
      DB.pagosProveedor
        .filter((p) => p.proveedorId === proveedorId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    ),
  );
}
