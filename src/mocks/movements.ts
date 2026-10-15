import type { Movement, Product, StockAlert } from "@/shared/types/inventory";
import {
  DB,
  delay,
  fail,
  sucursalActualId,
  stockEn,
  uid,
  type MovimientoDb,
  type ProductoDb,
} from "@/mocks/db";

export interface RegistrarMovimientoAtribucion {
  usuarioId?: string | number | null;
  usuarioNombre?: string | null;
  metodoPago?: string | null;
}

function toMovement(m: MovimientoDb): Movement {
  return {
    id: m.id,
    productId: m.productId,
    productName: m.productName,
    productCode: m.productCode,
    type: m.type,
    esTransferencia: m.esTransferencia,
    quantity: m.quantity,
    reason: m.reason || "Sin motivo especificado",
    date: m.date,
    previousQuantity: m.previousQuantity,
    newQuantity: m.newQuantity,
    valor_total: m.valor_total,
    metodoPago: m.metodoPago,
  };
}

/**
 * Descuenta stock de una sucursal y deja el movimiento de salida.
 * Lo usan las ventas rápidas, las cuentas corrientes, las boletas y los pedidos web.
 */
export function aplicarSalidaStock(args: {
  producto: ProductoDb;
  cantidad: number;
  sucursalId: string;
  motivo: string;
  precio?: number | null;
  metodoPago?: string | null;
  usuarioId?: string | null;
  usuarioNombre?: string | null;
  clienteId?: number | null;
  ventaId?: string | null;
  fecha?: string | null;
}): MovimientoDb {
  const { producto, cantidad, sucursalId } = args;
  if (!(cantidad > 0)) fail("La cantidad debe ser mayor a 0");
  const antes = stockEn(producto, sucursalId);
  if (antes < cantidad) {
    fail(`Stock insuficiente para "${producto.name}" (disponible: ${antes})`);
  }
  producto.stock[sucursalId] = antes - cantidad;
  const mov: MovimientoDb = {
    id: uid("mov"),
    productId: producto.id,
    productName: producto.name,
    productCode: producto.code,
    type: "salida",
    esTransferencia: false,
    quantity: cantidad,
    reason: args.motivo,
    date: args.fecha ?? new Date().toISOString(),
    previousQuantity: antes,
    newQuantity: antes - cantidad,
    valor_total: (args.precio ?? producto.price) * cantidad,
    metodoPago: args.metodoPago ?? null,
    usuarioId: args.usuarioId ?? null,
    usuarioNombre: args.usuarioNombre ?? null,
    sucursalId,
    clienteId: args.clienteId ?? null,
    ventaId: args.ventaId ?? null,
  };
  DB.movimientos.unshift(mov);
  return mov;
}

function buscarProducto(id: string): ProductoDb {
  const p = DB.productos.find((x) => x.id === id && x.activo);
  if (!p) fail("Producto no encontrado");
  return p;
}

export async function getAllMovements(): Promise<Movement[]> {
  const sucursalId = sucursalActualId();
  return delay(
    DB.movimientos
      .filter((m) => m.sucursalId === sucursalId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(toMovement),
  );
}

export async function registrarMovimiento(
  productId: string,
  type: "entrada" | "salida",
  quantity: number,
  reason: string,
  price?: number | null,
  atribucion?: RegistrarMovimientoAtribucion,
  fecha?: string | null,
) {
  const producto = buscarProducto(productId);
  const sucursalId = sucursalActualId();
  const usuarioId = atribucion?.usuarioId ? String(atribucion.usuarioId) : null;

  if (type === "salida") {
    aplicarSalidaStock({
      producto,
      cantidad: quantity,
      sucursalId,
      motivo: reason.trim(),
      precio: price,
      metodoPago: atribucion?.metodoPago,
      usuarioId,
      usuarioNombre: atribucion?.usuarioNombre,
      fecha,
    });
    return delay(true);
  }

  if (!(quantity > 0)) fail("La cantidad debe ser mayor a 0");
  const antes = stockEn(producto, sucursalId);
  producto.stock[sucursalId] = antes + quantity;
  DB.movimientos.unshift({
    id: uid("mov"),
    productId: producto.id,
    productName: producto.name,
    productCode: producto.code,
    type: "entrada",
    esTransferencia: false,
    quantity,
    reason: reason.trim(),
    date: fecha ?? new Date().toISOString(),
    previousQuantity: antes,
    newQuantity: antes + quantity,
    valor_total: (price ?? producto.cost) * quantity,
    metodoPago: atribucion?.metodoPago ?? null,
    usuarioId,
    usuarioNombre: atribucion?.usuarioNombre ?? null,
    sucursalId,
    clienteId: null,
    ventaId: null,
  });
  return delay(true);
}

export async function ajustarStockTotal(
  productId: string,
  stockNuevo: number,
  reason: string,
  price?: number | null,
  atribucion?: RegistrarMovimientoAtribucion,
) {
  const producto = buscarProducto(productId);
  const sucursalId = sucursalActualId();
  const actual = stockEn(producto, sucursalId);
  const diferencia = stockNuevo - actual;
  if (diferencia === 0) fail("El stock nuevo es igual al actual");
  await registrarMovimiento(
    productId,
    diferencia > 0 ? "entrada" : "salida",
    Math.abs(diferencia),
    reason,
    price,
    atribucion,
  );
  return { tipo: (diferencia > 0 ? "entrada" : "salida") as "entrada" | "salida", cantidad: Math.abs(diferencia) };
}

/**
 * Venta de un carrito completo: si un producto no tiene stock no se registra nada.
 */
export async function registrarVenta(args: {
  items: Array<{ productId: string; quantity: number; price?: number | null }>;
  reason: string;
  clienteId?: number | null;
  atribucion?: RegistrarMovimientoAtribucion;
}): Promise<string> {
  const sucursalId = sucursalActualId();
  if (args.items.length === 0) fail("La venta no tiene productos");

  // Validación previa para que sea todo o nada.
  for (const it of args.items) {
    const p = buscarProducto(it.productId);
    const disponible = stockEn(p, sucursalId);
    if (disponible < it.quantity) {
      fail(`Stock insuficiente para "${p.name}" (disponible: ${disponible})`);
    }
  }

  const ventaId = uid("venta");
  const usuarioId = args.atribucion?.usuarioId ? String(args.atribucion.usuarioId) : null;
  for (const it of args.items) {
    aplicarSalidaStock({
      producto: buscarProducto(it.productId),
      cantidad: it.quantity,
      sucursalId,
      motivo: args.reason.trim(),
      precio: it.price,
      metodoPago: args.atribucion?.metodoPago,
      usuarioId,
      usuarioNombre: args.atribucion?.usuarioNombre,
      clienteId: args.clienteId,
      ventaId,
    });
  }
  return delay(ventaId);
}

export async function eliminarTodosMovimientos() {
  DB.movimientos.length = 0;
  return delay(true);
}

export async function getStockBajo(): Promise<StockAlert[]> {
  const sucursalId = sucursalActualId();
  return delay(
    DB.productos
      .filter((p) => p.activo && stockEn(p, sucursalId) <= p.minStock)
      .map((p) => {
        const currentStock = stockEn(p, sucursalId);
        const product: Product = {
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category || "Sin categoría",
          subcategory: "",
          price: 0,
          cost: 0,
          quantity: currentStock,
          minStock: p.minStock,
          description: "",
          imageUrl: "",
          barcode: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          product,
          currentStock,
          minStock: p.minStock,
          difference: Math.max(p.minStock - currentStock, 0),
        };
      }),
  );
}

export async function getResumenInventario() {
  const sucursalId = sucursalActualId();
  const activos = DB.productos.filter((p) => p.activo);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  return delay({
    total_productos: activos.length,
    valor_total_stock: activos.reduce((s, p) => s + stockEn(p, sucursalId) * p.cost, 0),
    valor_total_venta: activos.reduce((s, p) => s + stockEn(p, sucursalId) * p.price, 0),
    total_movimientos_mes: DB.movimientos.filter(
      (m) => m.sucursalId === sucursalId && new Date(m.date) >= inicioMes,
    ).length,
    productos_bajo_stock: activos.filter((p) => stockEn(p, sucursalId) <= p.minStock).length,
  });
}
