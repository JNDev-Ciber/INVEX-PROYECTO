import { DB, delay, haceDias, sucursalActualId, SUC_CENTRAL, SUC_NORTE } from "@/mocks/db";
import { registrarVenta } from "@/mocks/movements";

export type BoletaItem = {
  producto_id?: string | number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type BoletaPendiente = {
  id: string;
  numero: string;
  fecha: string;
  cliente_nombre?: string | null;
  cliente_cuit?: string | null;
  cliente_direccion?: string | null;
  total: number;
  subtotal: number;
  creado_por: string;
  /** id del vendedor que la creó; la venta se le atribuye a él, no al cajero */
  creado_por_id?: string | null;
  /** cliente del CRM, si la venta se hizo eligiéndolo */
  cliente_id?: number | null;
  productos: Array<{
    producto_id: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }>;
};

export type BoletaHistorial = BoletaPendiente & {
  estado: string;
  procesado_por: string;
  procesado_en: string;
};

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------

interface BoletaRow extends BoletaPendiente {
  sucursal_id: string;
  cliente_telefono: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  procesado_por: string;
  procesado_en: string;
}

let boletaSeq = 0;

function nuevoIdBoleta(): string {
  boletaSeq += 1;
  return `boleta-${boletaSeq}`;
}

function crearSeed(
  numero: string,
  dias: number,
  hora: number,
  clienteId: number | null,
  items: Array<[number, number]>,
  estado: BoletaRow["estado"],
  procesadoPor = "",
  sucursalId = SUC_CENTRAL,
): BoletaRow {
  const productos = items.map(([idx, cantidad]) => {
    const p = DB.productos[idx];
    return { producto_id: p.id, nombre: p.name, cantidad, precioUnitario: p.price };
  });
  const subtotal = productos.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);
  const cliente = clienteId != null ? DB.clientes.find((c) => c.id === clienteId) : undefined;
  const fecha = haceDias(dias, hora, 15);
  return {
    id: nuevoIdBoleta(),
    numero,
    fecha,
    cliente_nombre: cliente?.nombre ?? null,
    cliente_cuit: cliente?.cuit ?? null,
    cliente_direccion: cliente?.direccion ?? null,
    cliente_telefono: cliente?.telefono ?? "",
    total: subtotal,
    subtotal,
    creado_por: "vendedor1",
    creado_por_id: "usr-vendedor1",
    cliente_id: clienteId,
    productos,
    sucursal_id: sucursalId,
    estado,
    procesado_por: procesadoPor,
    procesado_en: estado === "pendiente" ? "" : haceDias(dias, hora + 1, 5),
  };
}

const boletas: BoletaRow[] = [
  crearSeed("0001-00000121", 0, 9, 4, [[6, 1], [17, 1]], "pendiente"),
  crearSeed("0001-00000122", 0, 10, null, [[0, 1]], "pendiente"),
  crearSeed("0001-00000123", 0, 11, 3, [[10, 2], [18, 3]], "pendiente"),
  crearSeed("0001-00000118", 1, 10, 1, [[3, 1]], "aprobada", "caja1"),
  crearSeed("0001-00000119", 1, 12, null, [[7, 1], [19, 1]], "aprobada", "caja1"),
  crearSeed("0001-00000117", 2, 16, 6, [[14, 1]], "rechazada", "caja1"),
  crearSeed("0001-00000115", 3, 11, 2, [[20, 2]], "aprobada", "caja1"),
  crearSeed("0001-00000116", 3, 15, null, [[9, 1]], "aprobada", "caja1"),
  crearSeed("0002-00000041", 1, 10, null, [[11, 1]], "aprobada", "caja1", SUC_NORTE),
];
boletaSeq = boletas.length;

function aPendiente(b: BoletaRow): BoletaPendiente {
  return {
    id: b.id,
    numero: b.numero,
    fecha: b.fecha,
    cliente_nombre: b.cliente_nombre ?? null,
    cliente_cuit: b.cliente_cuit ?? null,
    cliente_direccion: b.cliente_direccion ?? null,
    total: b.total,
    subtotal: b.subtotal,
    creado_por: b.creado_por,
    creado_por_id: b.creado_por_id ?? null,
    cliente_id: b.cliente_id ?? null,
    productos: b.productos.map((p) => ({ ...p })),
  };
}

function aHistorial(b: BoletaRow): BoletaHistorial {
  return {
    id: b.id,
    numero: b.numero,
    fecha: b.fecha,
    cliente_nombre: b.cliente_nombre ?? null,
    cliente_cuit: b.cliente_cuit ?? null,
    cliente_direccion: b.cliente_direccion ?? null,
    total: b.total,
    subtotal: b.subtotal,
    estado: b.estado,
    creado_por: b.creado_por,
    procesado_por: b.procesado_por,
    procesado_en: b.procesado_en,
    productos: b.productos.map((p) => ({ ...p })),
  };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getBoletasPendientes(): Promise<BoletaPendiente[]> {
  const sucursalId = sucursalActualId();
  const rows = boletas
    .filter((b) => b.estado === "pendiente" && b.sucursal_id === sucursalId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(aPendiente);
  return delay(rows);
}

export async function getHistorialBoletas(
  limit = 50,
  offset = 0
): Promise<BoletaHistorial[]> {
  const sucursalId = sucursalActualId();
  const rows = boletas
    .filter((b) => b.estado !== "pendiente" && b.sucursal_id === sucursalId)
    .sort((a, b) => b.procesado_en.localeCompare(a.procesado_en))
    .slice(offset, offset + limit)
    .map(aHistorial);
  return delay(rows);
}

export async function insertarBoletaPendiente(args: {
  venta: any;
  vendedorId?: string | number;
  vendedorNombre?: string;
  /** Cliente del CRM elegido en la venta (opcional). */
  clienteId?: number | null;
}): Promise<void> {
  const { venta, vendedorId, vendedorNombre, clienteId } = args;
  if (!venta) throw new Error("missing_venta");

  const direccion = String(venta?.cliente?.direccion ?? "");
  const productos: BoletaPendiente["productos"] = Array.isArray(venta?.items)
    ? venta.items.map((it: any) => ({
        producto_id: String(it?.producto?.id ?? it?.productoId ?? it?.producto_id ?? ""),
        nombre: String(
          it?.producto?.name ??
            it?.producto?.nombre ??
            it?.nombre ??
            it?.producto_nombre ??
            ""
        ),
        cantidad: Number(it?.cantidad ?? 0) || 0,
        precioUnitario: Number(it?.precioUnitario ?? 0) || 0,
      }))
    : [];

  if (productos.length === 0) throw new Error("La boleta no tiene productos");

  const subtotalCalc = productos.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);
  const subtotal = Number(venta?.subtotal ?? 0) || subtotalCalc;
  const total = Number(venta?.total ?? 0) || subtotal;

  boletas.push({
    id: nuevoIdBoleta(),
    numero: String(venta?.numero ?? "") || `0001-${String(boletaSeq + 200).padStart(8, "0")}`,
    fecha: new Date().toISOString(),
    cliente_nombre: String(venta?.cliente?.nombre ?? "") || null,
    cliente_cuit: String(venta?.cliente?.cuit ?? "") || null,
    cliente_direccion: direccion || null,
    cliente_telefono: String(venta?.cliente?.telefono ?? ""),
    total,
    subtotal,
    creado_por: String(vendedorNombre ?? vendedorId ?? ""),
    creado_por_id: vendedorId ? String(vendedorId) : null,
    cliente_id: clienteId ?? null,
    productos,
    sucursal_id: sucursalActualId(),
    estado: "pendiente",
    procesado_por: "",
    procesado_en: "",
  });

  await delay(undefined);
}

/** Cambia el cliente de una boleta pendiente (null = sin cliente). */
export async function asignarClienteBoleta(boletaId: string, clienteId: number | null): Promise<void> {
  const b = boletas.find((x) => x.id === boletaId);
  if (!b) throw new Error("Boleta no encontrada");
  if (b.estado !== "pendiente") throw new Error("La boleta ya fue procesada");

  if (clienteId == null) {
    b.cliente_id = null;
  } else {
    const cliente = DB.clientes.find((c) => c.id === clienteId);
    if (!cliente) throw new Error("Cliente no encontrado");
    b.cliente_id = cliente.id;
    b.cliente_nombre = cliente.nombre;
    b.cliente_cuit = cliente.cuit ?? null;
    b.cliente_direccion = cliente.direccion ?? b.cliente_direccion ?? null;
    b.cliente_telefono = cliente.telefono ?? b.cliente_telefono;
  }
  await delay(undefined);
}

export async function aprobarBoleta(args: {
  id: string;
  procesadoPor: string;
  motivoPago: string;
  totalFinal: number;
  metodoPagoCodigo?: string;
}): Promise<{ boleta: any }> {
  const { id, procesadoPor, motivoPago, totalFinal, metodoPagoCodigo } = args;

  const b = boletas.find((x) => x.id === id);
  if (!b) throw new Error("Boleta no encontrada");
  if (b.estado !== "pendiente") throw new Error("La boleta ya fue procesada");

  // Con cuenta corriente la pantalla de caja ya registró la venta fiada
  // (descuenta stock y suma deuda al cliente) antes de aprobar; acá solo se
  // cierra la boleta para no duplicar el movimiento.
  if (metodoPagoCodigo !== "cuenta_corriente") {
    const factor = b.total > 0 ? totalFinal / b.total : 1;
    await registrarVenta({
      items: b.productos.map((p) => ({
        productId: p.producto_id,
        quantity: p.cantidad,
        price: Math.round(p.precioUnitario * factor),
      })),
      reason: "Venta",
      clienteId: b.cliente_id ?? null,
      atribucion: {
        usuarioId: b.creado_por_id ?? null,
        usuarioNombre: b.creado_por || null,
        metodoPago: metodoPagoCodigo ?? null,
      },
    });
  }

  b.estado = "aprobada";
  b.procesado_por = procesadoPor;
  b.procesado_en = new Date().toISOString();
  b.total = totalFinal;
  void motivoPago;

  const boleta = {
    id: b.id,
    numero: b.numero,
    fecha: b.fecha,
    cliente_nombre: b.cliente_nombre ?? null,
    cliente_cuit: b.cliente_cuit ?? null,
    cliente_telefono: b.cliente_telefono,
    cliente_id: b.cliente_id ?? null,
    subtotal: b.subtotal,
    total: totalFinal,
    creado_por: b.creado_por,
    creado_por_id: b.creado_por_id ?? null,
    estado: b.estado,
    items: b.productos.map((p) => ({
      producto_id: p.producto_id,
      nombre: p.nombre,
      cantidad: p.cantidad,
      precioUnitario: p.precioUnitario,
      cliente_direccion: b.cliente_direccion ?? "",
    })),
  };
  return delay({ boleta });
}

export async function rechazarBoleta(args: {
  id: string;
  procesadoPor: string;
}): Promise<void> {
  const { id, procesadoPor } = args;
  const b = boletas.find((x) => x.id === id);
  if (!b) throw new Error("Boleta no encontrada");
  if (b.estado !== "pendiente") throw new Error("La boleta ya fue procesada");
  b.estado = "rechazada";
  b.procesado_por = procesadoPor;
  b.procesado_en = new Date().toISOString();
  await delay(undefined);
}
