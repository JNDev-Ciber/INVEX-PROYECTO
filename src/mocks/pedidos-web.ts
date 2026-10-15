import { DB, delay, haceDias, stockEn, sucursalActualId } from "@/mocks/db";
import { registrarVenta } from "@/mocks/movements";

export type PedidoWebItem = {
  id: string;
  nombre: string;
  precio: number;
  quantity: number;
  stock_actual?: number;
};

export type PedidoWeb = {
  id: string;
  carrito: PedidoWebItem[];
  total: number;
  estado: "pendiente" | "aprobado" | "rechazado";
  creado_en: string;
  procesado_en: string | null;
  procesado_por: string | null;
  venta_id: string | null;
  motivo_rechazo: string | null;
  metodo_pago: string | null;
  canal: "whatsapp" | "mercadopago";
  pago_estado: "pendiente" | "aprobado" | "rechazado" | "reembolsado" | null;
  pago_id: string | null;
  pago_monto: number | null;
  // Datos que dejó el cliente en la tienda (sql/012). cliente_id se completa al aprobar.
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  cliente_id: number | null;
};

export type MetodoPagoPedido = "debito" | "credito" | "mercadopago";

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------

function renglon(idx: number, quantity: number): PedidoWebItem {
  const p = DB.productos[idx];
  return { id: p.id, nombre: p.name, precio: p.price, quantity };
}

function totalCarrito(carrito: PedidoWebItem[]): number {
  return carrito.reduce((s, it) => s + it.precio * it.quantity, 0);
}

function crearPedido(
  n: number,
  parcial: Partial<PedidoWeb> & {
    items: Array<[number, number]>;
    dias: number;
    hora: number;
  },
): PedidoWeb {
  const { items, dias, hora, ...resto } = parcial;
  const carrito = items.map(([idx, q]) => renglon(idx, q));
  return {
    id: `pedido-web-${n}`,
    carrito,
    total: totalCarrito(carrito),
    estado: "pendiente",
    creado_en: haceDias(dias, hora, 20),
    procesado_en: null,
    procesado_por: null,
    venta_id: null,
    motivo_rechazo: null,
    metodo_pago: null,
    canal: "whatsapp",
    pago_estado: null,
    pago_id: null,
    pago_monto: null,
    cliente_nombre: null,
    cliente_telefono: null,
    cliente_email: null,
    cliente_id: null,
    ...resto,
  };
}

const pedidos: PedidoWeb[] = [
  crearPedido(1, {
    items: [[7, 1], [18, 2]],
    dias: 0,
    hora: 8,
    canal: "whatsapp",
    cliente_nombre: "Sofía Ledesma",
    cliente_telefono: "261 555-3101",
    cliente_email: "sofia.ledesma@example.com",
  }),
  crearPedido(2, {
    items: [[10, 1]],
    dias: 0,
    hora: 10,
    canal: "mercadopago",
    pago_estado: "aprobado",
    pago_id: "MP-98412001",
    pago_monto: 579000,
    metodo_pago: "mercadopago",
    cliente_nombre: "Martín Aguirre",
    cliente_telefono: "261 555-3102",
    cliente_email: "martin.aguirre@example.com",
  }),
  crearPedido(3, {
    items: [[3, 1], [19, 1]],
    dias: 1,
    hora: 18,
    canal: "mercadopago",
    pago_estado: "pendiente",
    cliente_nombre: "Gabriela Ortiz",
    cliente_telefono: "261 555-3103",
    cliente_email: "gabi.ortiz@example.com",
  }),
  crearPedido(4, {
    items: [[17, 1]],
    dias: 3,
    hora: 12,
    estado: "aprobado",
    procesado_en: haceDias(3, 13, 5),
    procesado_por: "caja1",
    venta_id: "venta-web-seed-1",
    metodo_pago: "debito",
    canal: "whatsapp",
    cliente_nombre: "Diego Romero",
    cliente_telefono: "261 555-3104",
  }),
  crearPedido(5, {
    items: [[8, 1]],
    dias: 4,
    hora: 16,
    estado: "aprobado",
    procesado_en: haceDias(4, 16, 40),
    procesado_por: "vendedor1",
    venta_id: "venta-web-seed-2",
    metodo_pago: "mercadopago",
    canal: "mercadopago",
    pago_estado: "aprobado",
    pago_id: "MP-98411877",
    pago_monto: 729000,
    cliente_nombre: "Natalia Cabrera",
    cliente_telefono: "261 555-3105",
    cliente_email: "natalia.cabrera@example.com",
  }),
  crearPedido(6, {
    items: [[9, 1]],
    dias: 6,
    hora: 9,
    estado: "rechazado",
    procesado_en: haceDias(6, 10, 0),
    procesado_por: "caja1",
    motivo_rechazo: "Sin stock disponible",
    canal: "whatsapp",
    cliente_nombre: "Pablo Villegas",
    cliente_telefono: "261 555-3106",
  }),
];

function conStock(carrito: PedidoWebItem[]): PedidoWebItem[] {
  const suc = sucursalActualId();
  return carrito.map((it) => {
    const prod = DB.productos.find((p) => p.id === it.id);
    return { ...it, stock_actual: prod ? stockEn(prod, suc) : undefined };
  });
}

function salida(p: PedidoWeb, conStockActual: boolean): PedidoWeb {
  const carrito = p.carrito.map((it) => ({ ...it }));
  return { ...p, carrito: conStockActual ? conStock(carrito) : carrito };
}

function buscar(id: string): PedidoWeb {
  const p = pedidos.find((x) => x.id === id);
  if (!p) throw new Error("Pedido no encontrado");
  return p;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getPedidosWebPendientes(): Promise<PedidoWeb[]> {
  const rows = pedidos
    .filter((p) => p.estado === "pendiente")
    .sort((a, b) => a.creado_en.localeCompare(b.creado_en))
    .map((p) => salida(p, true));
  return delay(rows);
}

export async function getHistorialPedidosWeb(
  limit = 50,
  offset = 0
): Promise<PedidoWeb[]> {
  const rows = pedidos
    .filter((p) => p.estado !== "pendiente")
    .sort((a, b) => (b.procesado_en ?? "").localeCompare(a.procesado_en ?? ""))
    .slice(offset, offset + limit)
    .map((p) => salida(p, false));
  return delay(rows);
}

export async function editarPedidoWeb(args: {
  id: string;
  carrito: PedidoWebItem[];
}): Promise<void> {
  const p = buscar(args.id);
  if (p.estado !== "pendiente") throw new Error("El pedido ya fue procesado");
  const carrito = args.carrito
    .filter((it) => it.quantity > 0)
    .map((it) => ({
      id: String(it.id),
      nombre: it.nombre,
      precio: Number(it.precio) || 0,
      quantity: Number(it.quantity) || 0,
    }));
  if (carrito.length === 0) throw new Error("El pedido debe tener al menos un producto");
  p.carrito = carrito;
  p.total = totalCarrito(carrito);
  await delay(undefined);
}

export async function aprobarPedidoWeb(args: {
  id: string;
  procesadoPor: string;
  metodoPago?: MetodoPagoPedido;
  carrito?: PedidoWebItem[];
}): Promise<{ success: boolean; message: string; ventaId?: string }> {
  const p = buscar(args.id);
  if (p.estado !== "pendiente") throw new Error("El pedido ya fue procesado");

  const carrito = (args.carrito ?? p.carrito).filter((it) => it.quantity > 0);
  if (carrito.length === 0) throw new Error("El pedido no tiene productos");

  const metodo: string | null =
    args.metodoPago ?? (p.canal === "mercadopago" ? "mercadopago" : null);

  // registrarVenta valida stock y descuenta; si falla el pedido queda pendiente.
  const ventaId = await registrarVenta({
    items: carrito.map((it) => ({
      productId: String(it.id),
      quantity: it.quantity,
      price: it.precio,
    })),
    reason: "Venta web",
    clienteId: p.cliente_id ?? null,
    atribucion: {
      usuarioId: null,
      usuarioNombre: args.procesadoPor || null,
      metodoPago: metodo,
    },
  });

  p.carrito = carrito.map((it) => ({
    id: String(it.id),
    nombre: it.nombre,
    precio: it.precio,
    quantity: it.quantity,
  }));
  p.total = totalCarrito(p.carrito);
  p.estado = "aprobado";
  p.procesado_en = new Date().toISOString();
  p.procesado_por = args.procesadoPor;
  p.venta_id = ventaId;
  p.metodo_pago = metodo;

  return delay({ success: true, message: "Pedido aprobado", ventaId });
}

// En modo demo no hay Mercado Pago: no hay pagos para sincronizar.
export async function sincronizarPagosMercadoPago(): Promise<{ mensaje: string; revisados: number }> {
  return delay({ mensaje: "Sin pagos nuevos (modo demo)", revisados: 0 }, 400);
}

export async function rechazarPedidoWeb(args: {
  id: string;
  procesadoPor: string;
  motivo?: string;
}): Promise<void> {
  const p = buscar(args.id);
  if (p.estado !== "pendiente") throw new Error("El pedido ya fue procesado");
  p.estado = "rechazado";
  p.procesado_en = new Date().toISOString();
  p.procesado_por = args.procesadoPor;
  p.motivo_rechazo = args.motivo ?? null;
  await delay(undefined);
}
