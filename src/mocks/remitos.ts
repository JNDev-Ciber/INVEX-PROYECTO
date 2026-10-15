import {
  DB,
  SUC_CENTRAL,
  SUC_NORTE,
  currentUser,
  delay,
  haceDias,
  stockEn,
  type MovimientoDb,
} from "@/mocks/db";

export type EstadoRemito =
  | "borrador"
  | "enviado"
  | "recibido"
  | "recibido_con_diferencias"
  | "anulado";

export interface Remito {
  id: string;
  numero: number;
  estado: EstadoRemito;
  origen_id: string;
  origen_nombre: string;
  destino_id: string;
  destino_nombre: string;
  observaciones: string | null;
  renglones: number;
  unidades_enviadas: number;
  unidades_recibidas: number | null;
  creado_por: string | null;
  creado_en: string;
  enviado_por: string | null;
  enviado_en: string | null;
  recibido_por: string | null;
  recibido_en: string | null;
  anulado_por: string | null;
  anulado_en: string | null;
  motivo_anulacion: string | null;
}

export interface RemitoItem {
  producto_id: string;
  codigo: string;
  nombre: string;
  cantidad_enviada: number;
  cantidad_recibida: number | null;
  stock_origen: number;
}

export interface StockParaRemito {
  producto_id: string;
  codigo: string;
  nombre: string;
  codigo_barras: string | null;
  stock: number;
}

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------

interface LineaRemito {
  producto_id: string;
  cantidad_enviada: number;
  cantidad_recibida: number | null;
}

const remitos: Remito[] = [];
const lineasPorRemito = new Map<string, LineaRemito[]>();
let remitoSeq = 0;

function nombreSucursal(id: string): string {
  return DB.sucursales.find((s) => s.id === id)?.nombre ?? id;
}

function usuarioActual(): string {
  return currentUser()?.username ?? "caja1";
}

function sembrar(
  parcial: Partial<Remito> & {
    origen_id: string;
    destino_id: string;
    estado: EstadoRemito;
    items: Array<[number, number, number | null]>;
    dias: number;
  },
): void {
  const { items, dias, ...resto } = parcial;
  remitoSeq += 1;
  const id = `remito-${remitoSeq}`;
  const lineas: LineaRemito[] = items.map(([idx, enviada, recibida]) => ({
    producto_id: DB.productos[idx].id,
    cantidad_enviada: enviada,
    cantidad_recibida: recibida,
  }));
  const recibidas = lineas.every((l) => l.cantidad_recibida != null)
    ? lineas.reduce((s, l) => s + (l.cantidad_recibida ?? 0), 0)
    : null;
  lineasPorRemito.set(id, lineas);
  remitos.push({
    id,
    numero: remitoSeq,
    origen_nombre: nombreSucursal(parcial.origen_id),
    destino_nombre: nombreSucursal(parcial.destino_id),
    observaciones: null,
    renglones: lineas.length,
    unidades_enviadas: lineas.reduce((s, l) => s + l.cantidad_enviada, 0),
    unidades_recibidas: recibidas,
    creado_por: "caja1",
    creado_en: haceDias(dias, 9),
    enviado_por: null,
    enviado_en: null,
    recibido_por: null,
    recibido_en: null,
    anulado_por: null,
    anulado_en: null,
    motivo_anulacion: null,
    ...resto,
  });
}

// Remitos "enviado" y "recibido" ya están reflejados en el stock semilla.
sembrar({
  origen_id: SUC_CENTRAL,
  destino_id: SUC_NORTE,
  estado: "recibido",
  items: [[0, 2, 2], [6, 4, 4]],
  dias: 14,
  observaciones: "Reposición mensual sucursal Norte",
  enviado_por: "caja1",
  enviado_en: haceDias(14, 10),
  recibido_por: "vendedor1",
  recibido_en: haceDias(13, 11),
});
sembrar({
  origen_id: SUC_NORTE,
  destino_id: SUC_CENTRAL,
  estado: "recibido_con_diferencias",
  items: [[10, 3, 2], [17, 4, 4]],
  dias: 8,
  observaciones: "Devolución de stock excedente",
  enviado_por: "caja1",
  enviado_en: haceDias(8, 10),
  recibido_por: "caja1",
  recibido_en: haceDias(7, 12),
});
sembrar({
  origen_id: SUC_CENTRAL,
  destino_id: SUC_NORTE,
  estado: "enviado",
  items: [[3, 2, null], [18, 6, null], [19, 2, null]],
  dias: 1,
  observaciones: "Pedido urgente por promoción",
  enviado_por: "caja1",
  enviado_en: haceDias(1, 15),
});
sembrar({
  origen_id: SUC_CENTRAL,
  destino_id: SUC_NORTE,
  estado: "borrador",
  items: [[7, 2, null], [14, 1, null]],
  dias: 0,
  observaciones: null,
});
sembrar({
  origen_id: SUC_NORTE,
  destino_id: SUC_CENTRAL,
  estado: "anulado",
  items: [[1, 1, null]],
  dias: 20,
  anulado_por: "caja1",
  anulado_en: haceDias(20, 11),
  motivo_anulacion: "Cargado por error",
});

function buscar(id: string): Remito {
  const r = remitos.find((x) => x.id === id);
  if (!r) throw new Error("Remito no encontrado");
  return r;
}

function lineasDe(id: string): LineaRemito[] {
  return lineasPorRemito.get(id) ?? [];
}

function pushMovimiento(
  tipo: "entrada" | "salida",
  producto: (typeof DB.productos)[number],
  sucursalId: string,
  cantidad: number,
  anterior: number,
  nuevo: number,
  remito: Remito,
): void {
  const mov: MovimientoDb = {
    id: `mov-remito-${remito.id}-${tipo}-${producto.id}-${Date.now()}`,
    productId: producto.id,
    productName: producto.name,
    productCode: producto.code,
    type: tipo,
    esTransferencia: true,
    quantity: cantidad,
    reason: `Remito N° ${remito.numero} (${remito.origen_nombre} → ${remito.destino_nombre})`,
    date: new Date().toISOString(),
    previousQuantity: anterior,
    newQuantity: nuevo,
    valor_total: producto.cost * cantidad,
    metodoPago: null,
    usuarioId: currentUser()?.id ?? null,
    usuarioNombre: usuarioActual(),
    sucursalId,
    clienteId: null,
    ventaId: null,
  };
  DB.movimientos.unshift(mov);
}

function mover(
  remito: Remito,
  sucursalId: string,
  productoId: string,
  delta: number,
): void {
  const prod = DB.productos.find((p) => p.id === productoId);
  if (!prod || delta === 0) return;
  const anterior = stockEn(prod, sucursalId);
  const nuevo = anterior + delta;
  if (nuevo < 0) {
    throw new Error(`Stock insuficiente de ${prod.name} en ${nombreSucursal(sucursalId)}`);
  }
  prod.stock[sucursalId] = nuevo;
  pushMovimiento(delta < 0 ? "salida" : "entrada", prod, sucursalId, Math.abs(delta), anterior, nuevo, remito);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getRemitos(estado?: EstadoRemito | null): Promise<Remito[]> {
  const rows = remitos
    .filter((r) => !estado || r.estado === estado)
    .sort((a, b) => b.numero - a.numero)
    .slice(0, 200)
    .map((r) => ({ ...r }));
  return delay(rows);
}

export async function getRemitoItems(remitoId: string): Promise<RemitoItem[]> {
  const remito = buscar(remitoId);
  const items: RemitoItem[] = lineasDe(remitoId).map((l) => {
    const prod = DB.productos.find((p) => p.id === l.producto_id);
    return {
      producto_id: l.producto_id,
      codigo: prod?.code ?? "",
      nombre: prod?.name ?? "Producto eliminado",
      cantidad_enviada: l.cantidad_enviada,
      cantidad_recibida: l.cantidad_recibida,
      stock_origen: prod ? stockEn(prod, remito.origen_id) : 0,
    };
  });
  return delay(items);
}

export async function buscarStockParaRemito(
  sucursalId: string,
  busqueda: string
): Promise<StockParaRemito[]> {
  const q = busqueda.trim().toLowerCase();
  const rows = DB.productos
    .filter((p) => p.activo && stockEn(p, sucursalId) > 0)
    .filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q)
    )
    .slice(0, 20)
    .map((p) => ({
      producto_id: p.id,
      codigo: p.code,
      nombre: p.name,
      codigo_barras: p.barcode || null,
      stock: stockEn(p, sucursalId),
    }));
  return delay(rows);
}

export async function crearRemito(payload: {
  origenId: string;
  destinoId: string;
  items: Array<{ producto_id: string; cantidad: number }>;
  observaciones?: string;
}): Promise<string> {
  const { origenId, destinoId, items, observaciones } = payload;
  if (!DB.sucursales.some((s) => s.id === origenId)) throw new Error("Sucursal de origen inexistente");
  if (!DB.sucursales.some((s) => s.id === destinoId)) throw new Error("Sucursal de destino inexistente");
  if (origenId === destinoId) throw new Error("El origen y el destino deben ser distintos");
  if (!items || items.length === 0) throw new Error("El remito debe tener al menos un producto");

  const lineas = new Map<string, number>();
  for (const it of items) {
    const cantidad = Number(it.cantidad) || 0;
    if (cantidad <= 0) throw new Error("Las cantidades deben ser mayores a cero");
    const prod = DB.productos.find((p) => p.id === it.producto_id);
    if (!prod) throw new Error("Producto no encontrado");
    lineas.set(it.producto_id, (lineas.get(it.producto_id) ?? 0) + cantidad);
  }
  for (const [productoId, cantidad] of lineas) {
    const prod = DB.productos.find((p) => p.id === productoId)!;
    if (cantidad > stockEn(prod, origenId)) {
      throw new Error(`Stock insuficiente de ${prod.name} en ${nombreSucursal(origenId)}`);
    }
  }

  remitoSeq += 1;
  const id = `remito-${remitoSeq}`;
  const arr: LineaRemito[] = [...lineas].map(([producto_id, cantidad_enviada]) => ({
    producto_id,
    cantidad_enviada,
    cantidad_recibida: null,
  }));
  lineasPorRemito.set(id, arr);
  remitos.push({
    id,
    numero: remitoSeq,
    estado: "borrador",
    origen_id: origenId,
    origen_nombre: nombreSucursal(origenId),
    destino_id: destinoId,
    destino_nombre: nombreSucursal(destinoId),
    observaciones: observaciones?.trim() ? observaciones.trim() : null,
    renglones: arr.length,
    unidades_enviadas: arr.reduce((s, l) => s + l.cantidad_enviada, 0),
    unidades_recibidas: null,
    creado_por: usuarioActual(),
    creado_en: new Date().toISOString(),
    enviado_por: null,
    enviado_en: null,
    recibido_por: null,
    recibido_en: null,
    anulado_por: null,
    anulado_en: null,
    motivo_anulacion: null,
  });
  return delay(id);
}

export async function enviarRemito(remitoId: string): Promise<void> {
  const r = buscar(remitoId);
  if (r.estado !== "borrador") throw new Error("Solo se pueden enviar remitos en borrador");
  const lineas = lineasDe(remitoId);

  // Validar todo antes de mover para no dejar el stock a medias.
  for (const l of lineas) {
    const prod = DB.productos.find((p) => p.id === l.producto_id);
    if (!prod) throw new Error("Producto no encontrado");
    if (l.cantidad_enviada > stockEn(prod, r.origen_id)) {
      throw new Error(`Stock insuficiente de ${prod.name} en ${r.origen_nombre}`);
    }
  }
  for (const l of lineas) mover(r, r.origen_id, l.producto_id, -l.cantidad_enviada);

  r.estado = "enviado";
  r.enviado_por = usuarioActual();
  r.enviado_en = new Date().toISOString();
  await delay(undefined);
}

export async function recibirRemito(
  remitoId: string,
  items: Array<{ producto_id: string; cantidad_recibida: number }>
): Promise<EstadoRemito> {
  const r = buscar(remitoId);
  if (r.estado !== "enviado") throw new Error("Solo se pueden recibir remitos enviados");
  const lineas = lineasDe(remitoId);

  const recibidas = new Map(items.map((it) => [it.producto_id, Number(it.cantidad_recibida) || 0]));
  for (const l of lineas) {
    const cant = recibidas.get(l.producto_id) ?? l.cantidad_enviada;
    if (cant < 0) throw new Error("Las cantidades recibidas no pueden ser negativas");
    if (cant > l.cantidad_enviada) {
      const prod = DB.productos.find((p) => p.id === l.producto_id);
      throw new Error(`No se puede recibir más de lo enviado (${prod?.name ?? l.producto_id})`);
    }
  }

  let hayDiferencias = false;
  for (const l of lineas) {
    const cant = recibidas.get(l.producto_id) ?? l.cantidad_enviada;
    l.cantidad_recibida = cant;
    if (cant !== l.cantidad_enviada) hayDiferencias = true;
    mover(r, r.destino_id, l.producto_id, cant);
  }

  r.estado = hayDiferencias ? "recibido_con_diferencias" : "recibido";
  r.unidades_recibidas = lineas.reduce((s, l) => s + (l.cantidad_recibida ?? 0), 0);
  r.recibido_por = usuarioActual();
  r.recibido_en = new Date().toISOString();
  return delay(r.estado);
}

export async function anularRemito(remitoId: string, motivo?: string): Promise<void> {
  const r = buscar(remitoId);
  if (r.estado !== "borrador" && r.estado !== "enviado") {
    throw new Error("Solo se pueden anular remitos en borrador o enviados");
  }
  // Un remito enviado ya descontó el stock del origen: se devuelve.
  if (r.estado === "enviado") {
    for (const l of lineasDe(remitoId)) mover(r, r.origen_id, l.producto_id, l.cantidad_enviada);
  }
  r.estado = "anulado";
  r.anulado_por = usuarioActual();
  r.anulado_en = new Date().toISOString();
  r.motivo_anulacion = motivo?.trim() ? motivo.trim() : null;
  await delay(undefined);
}
