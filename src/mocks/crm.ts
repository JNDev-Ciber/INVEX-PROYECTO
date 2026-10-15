/**
 * CRM de la demo: todo se deriva de `DB` (clientes, movimientos con cliente,
 * ventas fiadas y pagos). Los seguimientos y las notas viven en memoria acá.
 */
import { DB, currentUser, delay, fail, haceDias, soloFecha, uid } from "@/mocks/db";

export type Segmento = "nuevo" | "frecuente" | "ocasional" | "inactivo" | "sin_compras";
export type TipoSeguimiento = "nota" | "llamada" | "whatsapp" | "visita" | "tarea";

export interface ClienteCrm {
  id: number;
  nombre: string;
  telefono: string | null;
  cuit: string | null;
  email: string | null;
  direccion: string | null;
  notas: string;
  etiquetas: string[];
  saldo_pendiente: number;
  alta: string | null;
  compras: number;
  total_comprado: number;
  ticket_promedio: number;
  primera_compra: string | null;
  ultima_compra: string | null;
  dias_sin_comprar: number | null;
  compras_90_dias: number;
  segmento: Segmento;
  proximo_seguimiento: string | null;
  seguimientos_pendientes: number;
}

export interface Seguimiento {
  id: string;
  tipo: TipoSeguimiento;
  texto: string;
  fecha_programada: string | null;
  hecho: boolean;
  completado_en: string | null;
  creado_por: string;
  creado_en: string;
}

export interface ClienteDetalle {
  compras: Array<{
    fecha: string;
    origen: "fiado" | "caja" | "rapida" | "web";
    total: number;
    referencia: string;
    sucursal: string | null;
  }>;
  pagos: Array<{ fecha: string; monto: number }>;
  productos: Array<{ nombre: string; cantidad: number; total: number }>;
  seguimientos: Seguimiento[];
}

export interface TareaAgenda {
  id: string;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  tipo: TipoSeguimiento;
  texto: string;
  fecha_programada: string;
  vencido: boolean;
}

export interface DatosCliente {
  nombre: string;
  telefono: string;
  cuit: string;
  email: string;
  direccion: string;
  notas: string;
  etiquetas: string[];
}

export interface ClienteLista {
  id: number;
  nombre: string;
  telefono: string | null;
  total_comprado: number;
  dias_sin_comprar: number | null;
  compras_90_dias?: number;
  saldo_pendiente?: number;
}

export interface CrmInteligencia {
  datos: {
    total_clientes: number;
    con_compras: number;
    ingreso_total: number;
    compras_total: number;
    ticket_promedio: number;
    ingreso_90: number;
    nuevos_30: number;
    segmentos: Record<string, number>;
    top_clientes: Array<{
      id: number;
      nombre: string;
      total: number;
      compras: number;
      pct: number;
      pct_acum: number;
    }>;
    pareto_80_clientes: number;
    tendencia_mensual: Array<{ mes: string; ingreso: number; compras: number }>;
  };
  marketing: {
    reactivar: ClienteLista[];
    fidelizar: ClienteLista[];
    en_riesgo: ClienteLista[];
    cross_sell: Array<{ producto: string; compradores: number; unidades: number }>;
  };
  finanzas: {
    deuda_total: number;
    clientes_con_deuda: number;
    aging: Record<string, { monto: number; ventas: number }>;
    deudores: Array<{
      id: number;
      nombre: string;
      telefono: string | null;
      saldo: number;
      dias_sin_comprar: number | null;
    }>;
    concentracion: { top5_pct: number; top10_pct: number };
    por_sucursal: Array<{ sucursal: string; ingreso: number; compras: number }>;
  };
  liderazgo: {
    seguimientos: {
      total: number;
      hechos: number;
      pendientes: number;
      vencidos: number;
      cumplimiento_pct: number;
    };
    por_responsable: Array<{ responsable: string; creados: number; hechos: number; pendientes: number }>;
    agenda_vencida: number;
    ingreso_mes: number;
    ingreso_mes_anterior: number;
  };
}

// ---------------------------------------------------------------------------
// Estado local (seguimientos, notas y etiquetas)
// ---------------------------------------------------------------------------

type SeguimientoCliente = Seguimiento & { cliente_id: number };

/** Fecha local (YYYY-MM-DD) a `dias` días de hoy (negativo = pasado). */
function fechaRelativa(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const hoyLocal = () => fechaRelativa(0);

const seguimientos: SeguimientoCliente[] = [
  {
    id: "seg-1",
    cliente_id: 3,
    tipo: "llamada",
    texto: "Llamar a compras del hotel para coordinar el pago de las facturas pendientes.",
    fecha_programada: fechaRelativa(-2),
    hecho: false,
    completado_en: null,
    creado_por: "caja1",
    creado_en: haceDias(6, 10),
  },
  {
    id: "seg-2",
    cliente_id: 5,
    tipo: "whatsapp",
    texto: "Recordarle el saldo vencido y ofrecer plan de pagos en cuotas.",
    fecha_programada: fechaRelativa(0),
    hecho: false,
    completado_en: null,
    creado_por: "vendedor1",
    creado_en: haceDias(3, 11),
  },
  {
    id: "seg-3",
    cliente_id: 1,
    tipo: "tarea",
    texto: "Enviar presupuesto de aire split inverter para el departamento nuevo.",
    fecha_programada: fechaRelativa(2),
    hecho: false,
    completado_en: null,
    creado_por: "vendedor1",
    creado_en: haceDias(1, 16),
  },
  {
    id: "seg-4",
    cliente_id: 2,
    tipo: "visita",
    texto: "Pasar por el local a mostrarle la nueva línea de heladeras.",
    fecha_programada: fechaRelativa(5),
    hecho: false,
    completado_en: null,
    creado_por: "caja1",
    creado_en: haceDias(2, 9),
  },
  {
    id: "seg-5",
    cliente_id: 4,
    tipo: "nota",
    texto: "Prefiere que la contacten por WhatsApp y por la tarde.",
    fecha_programada: null,
    hecho: false,
    completado_en: null,
    creado_por: "vendedor1",
    creado_en: haceDias(15, 17),
  },
  {
    id: "seg-6",
    cliente_id: 8,
    tipo: "llamada",
    texto: "Confirmó la recepción del lavarropas y quedó conforme con la entrega.",
    fecha_programada: fechaRelativa(-8),
    hecho: true,
    completado_en: haceDias(8, 12),
    creado_por: "caja1",
    creado_en: haceDias(10, 10),
  },
];

const extras = new Map<number, { notas: string; etiquetas: string[] }>([
  [1, { notas: "Clienta frecuente, muy puntual con los pagos.", etiquetas: ["VIP"] }],
  [3, { notas: "Cuenta corporativa. Factura A.", etiquetas: ["Empresa", "Cuenta corriente"] }],
  [5, { notas: "Compra en volumen para su negocio.", etiquetas: ["Empresa"] }],
  [8, { notas: "", etiquetas: ["Consorcio"] }],
]);

function extrasDe(id: number) {
  return extras.get(id) ?? { notas: "", etiquetas: [] as string[] };
}

// ---------------------------------------------------------------------------
// Derivación de compras desde DB
// ---------------------------------------------------------------------------

interface CompraRaw {
  fechaIso: string;
  total: number;
  origen: "fiado" | "caja";
  referencia: string;
  sucursalId: string | null;
  items: Array<{ nombre: string; cantidad: number; total: number }>;
}

function nombreSucursal(id: string | null): string | null {
  if (!id) return null;
  return DB.sucursales.find((s) => s.id === id)?.nombre ?? null;
}

function esMovimientoFiado(m: { metodoPago: string | null; reason: string }): boolean {
  const txt = `${m.metodoPago ?? ""} ${m.reason}`.toLowerCase();
  return txt.includes("fiad") || txt.includes("cuenta corriente");
}

function comprasDeTodos(): Map<number, CompraRaw[]> {
  const porCliente = new Map<number, CompraRaw[]>();
  const agregar = (clienteId: number, c: CompraRaw) => {
    const lista = porCliente.get(clienteId);
    if (lista) lista.push(c);
    else porCliente.set(clienteId, [c]);
  };

  // Ventas de caja: renglones agrupados por ventaId.
  const ventas = new Map<string, { clienteId: number; compra: CompraRaw }>();
  for (const m of DB.movimientos) {
    if (m.type !== "salida" || m.esTransferencia || m.clienteId == null) continue;
    if (esMovimientoFiado(m)) continue;
    const key = m.ventaId ?? m.id;
    let v = ventas.get(key);
    if (!v) {
      v = {
        clienteId: m.clienteId,
        compra: {
          fechaIso: m.date,
          total: 0,
          origen: "caja",
          referencia: m.ventaId ? `Venta ${m.ventaId.replace("venta-seed-", "#")}` : "Venta",
          sucursalId: m.sucursalId,
          items: [],
        },
      };
      ventas.set(key, v);
    }
    v.compra.total += m.valor_total;
    v.compra.items.push({ nombre: m.productName, cantidad: m.quantity, total: m.valor_total });
  }
  for (const v of ventas.values()) agregar(v.clienteId, v.compra);

  // Ventas fiadas.
  for (const vf of DB.ventasFiado) {
    agregar(vf.clienteId, {
      fechaIso: vf.createdAt,
      total: vf.total,
      origen: "fiado",
      referencia: `Fiado #${vf.id}`,
      sucursalId: null,
      items: vf.detalles.map((d) => ({ nombre: d.productoNombre, cantidad: d.cantidad, total: d.subtotal })),
    });
  }

  for (const lista of porCliente.values()) lista.sort((a, b) => b.fechaIso.localeCompare(a.fechaIso));
  return porCliente;
}

const DIA_MS = 86_400_000;
const diasDesde = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DIA_MS));

function segmentoDe(compras: CompraRaw[]): Segmento {
  if (compras.length === 0) return "sin_compras";
  const ultima = diasDesde(compras[0].fechaIso);
  const primera = diasDesde(compras[compras.length - 1].fechaIso);
  const c90 = compras.filter((c) => diasDesde(c.fechaIso) <= 90).length;
  if (primera <= 30) return "nuevo";
  if (c90 >= 3 && ultima <= 60) return "frecuente";
  if (ultima <= 60) return "ocasional";
  return "inactivo";
}

function construirClientes(): ClienteCrm[] {
  const compras = comprasDeTodos();
  return DB.clientes.map((c) => {
    const lista = compras.get(c.id) ?? [];
    const total = lista.reduce((s, x) => s + x.total, 0);
    const pendientes = seguimientos.filter((s) => s.cliente_id === c.id && !s.hecho && s.fecha_programada);
    const proximo = pendientes.map((s) => s.fecha_programada!).sort()[0] ?? null;
    const ex = extrasDe(c.id);
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono ?? null,
      cuit: c.cuit ?? null,
      email: c.email ?? null,
      direccion: c.direccion ?? null,
      notas: ex.notas,
      etiquetas: [...ex.etiquetas],
      saldo_pendiente: c.saldoPendiente,
      alta: soloFecha(haceDias(120 + c.id * 9)),
      compras: lista.length,
      total_comprado: total,
      ticket_promedio: lista.length ? Math.round(total / lista.length) : 0,
      primera_compra: lista.length ? soloFecha(lista[lista.length - 1].fechaIso) : null,
      ultima_compra: lista.length ? soloFecha(lista[0].fechaIso) : null,
      dias_sin_comprar: lista.length ? diasDesde(lista[0].fechaIso) : null,
      compras_90_dias: lista.filter((x) => diasDesde(x.fechaIso) <= 90).length,
      segmento: segmentoDe(lista),
      proximo_seguimiento: proximo,
      seguimientos_pendientes: pendientes.length,
    };
  });
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getClientesCrm(): Promise<ClienteCrm[]> {
  return delay(construirClientes(), 120);
}

export async function getClienteDetalle(clienteId: number): Promise<ClienteDetalle> {
  const lista = comprasDeTodos().get(clienteId) ?? [];
  const productos = new Map<string, { nombre: string; cantidad: number; total: number }>();
  for (const c of lista) {
    for (const it of c.items) {
      const p = productos.get(it.nombre) ?? { nombre: it.nombre, cantidad: 0, total: 0 };
      p.cantidad += it.cantidad;
      p.total += it.total;
      productos.set(it.nombre, p);
    }
  }
  const detalle: ClienteDetalle = {
    compras: lista.map((c) => ({
      fecha: c.fechaIso,
      origen: c.origen,
      total: c.total,
      referencia: c.referencia,
      sucursal: nombreSucursal(c.sucursalId),
    })),
    pagos: DB.pagos
      .filter((p) => p.cliente_id === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((p) => ({ fecha: p.fecha, monto: p.monto })),
    productos: [...productos.values()].sort((a, b) => b.total - a.total),
    seguimientos: seguimientos
      .filter((s) => s.cliente_id === clienteId)
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
      .map<Seguimiento>((s) => ({
        id: s.id,
        tipo: s.tipo,
        texto: s.texto,
        fecha_programada: s.fecha_programada,
        hecho: s.hecho,
        completado_en: s.completado_en,
        creado_por: s.creado_por,
        creado_en: s.creado_en,
      })),
  };
  return delay(detalle, 100);
}

export async function getAgenda(dias = 7): Promise<TareaAgenda[]> {
  const hoy = hoyLocal();
  const limite = fechaRelativa(dias);
  const tareas = seguimientos
    .filter((s) => !s.hecho && s.fecha_programada && s.fecha_programada <= limite)
    .sort((a, b) => a.fecha_programada!.localeCompare(b.fecha_programada!))
    .map<TareaAgenda>((s) => {
      const cliente = DB.clientes.find((c) => c.id === s.cliente_id);
      return {
        id: s.id,
        cliente_id: s.cliente_id,
        cliente_nombre: cliente?.nombre ?? "Cliente",
        cliente_telefono: cliente?.telefono ?? null,
        tipo: s.tipo,
        texto: s.texto,
        fecha_programada: s.fecha_programada!,
        vencido: s.fecha_programada! < hoy,
      };
    });
  return delay(tareas, 100);
}

export async function actualizarCliente(clienteId: number, datos: DatosCliente) {
  const cliente = DB.clientes.find((c) => c.id === clienteId);
  if (!cliente) fail("Cliente no encontrado");
  const nombre = datos.nombre.trim();
  if (!nombre) fail("El nombre es obligatorio");
  cliente.nombre = nombre;
  cliente.telefono = datos.telefono.trim() || undefined;
  cliente.cuit = datos.cuit.trim() || undefined;
  cliente.email = datos.email.trim() || undefined;
  cliente.direccion = datos.direccion.trim() || undefined;
  extras.set(clienteId, {
    notas: datos.notas,
    etiquetas: datos.etiquetas.map((e) => e.trim()).filter(Boolean),
  });
  await delay(null, 100);
}

export async function agregarSeguimiento(payload: {
  clienteId: number;
  tipo: TipoSeguimiento;
  texto: string;
  fechaProgramada: string | null;
}): Promise<string> {
  if (!DB.clientes.some((c) => c.id === payload.clienteId)) fail("Cliente no encontrado");
  const texto = payload.texto.trim();
  if (!texto) fail("Escribí el texto del seguimiento");
  const id = uid("seg");
  seguimientos.push({
    id,
    cliente_id: payload.clienteId,
    tipo: payload.tipo,
    texto,
    fecha_programada: payload.fechaProgramada,
    hecho: false,
    completado_en: null,
    creado_por: currentUser()?.username ?? "vendedor1",
    creado_en: new Date().toISOString(),
  });
  return delay(id, 100);
}

export async function completarSeguimiento(id: string, hecho: boolean) {
  const s = seguimientos.find((x) => x.id === id);
  if (!s) fail("Seguimiento no encontrado");
  s.hecho = hecho;
  s.completado_en = hecho ? new Date().toISOString() : null;
  await delay(null, 80);
}

export async function eliminarSeguimiento(id: string) {
  const idx = seguimientos.findIndex((x) => x.id === id);
  if (idx === -1) fail("Seguimiento no encontrado");
  seguimientos.splice(idx, 1);
  await delay(null, 80);
}

// ---------------------------------------------------------------------------
// Inteligencia del negocio
// ---------------------------------------------------------------------------

const pct1 = (n: number) => Math.round(n * 10) / 10;

function mesDe(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function calcularInteligencia(): CrmInteligencia {
  const clientes = construirClientes();
  const comprasPorCliente = comprasDeTodos();
  const todas = [...comprasPorCliente.entries()].flatMap(([clienteId, lista]) => lista.map((c) => ({ clienteId, ...c })));

  const ingresoTotal = todas.reduce((s, c) => s + c.total, 0);
  const ingreso90 = todas.filter((c) => diasDesde(c.fechaIso) <= 90).reduce((s, c) => s + c.total, 0);
  const conCompras = clientes.filter((c) => c.compras > 0);

  const segmentos: Record<string, number> = {};
  for (const c of clientes) segmentos[c.segmento] = (segmentos[c.segmento] ?? 0) + 1;

  // Top clientes + Pareto
  const ranking = [...conCompras].sort((a, b) => b.total_comprado - a.total_comprado);
  let acum = 0;
  let pareto = 0;
  const topClientes = ranking.slice(0, 8).map((c) => ({ id: c.id, nombre: c.nombre, total: c.total_comprado, compras: c.compras, pct: 0, pct_acum: 0 }));
  for (const c of ranking) {
    acum += c.total_comprado;
    if (pareto === 0 && ingresoTotal > 0 && acum / ingresoTotal >= 0.8) pareto = ranking.indexOf(c) + 1;
  }
  let acumTop = 0;
  for (const t of topClientes) {
    acumTop += t.total;
    t.pct = ingresoTotal ? pct1((100 * t.total) / ingresoTotal) : 0;
    t.pct_acum = ingresoTotal ? pct1((100 * acumTop) / ingresoTotal) : 0;
  }

  // Tendencia mensual (últimos 6 meses)
  const tendencia: Array<{ mes: string; ingreso: number; compras: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    tendencia.push({ mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, ingreso: 0, compras: 0 });
  }
  for (const c of todas) {
    const fila = tendencia.find((t) => t.mes === mesDe(c.fechaIso));
    if (fila) {
      fila.ingreso += c.total;
      fila.compras += 1;
    }
  }
  const ingresoMes = tendencia[tendencia.length - 1].ingreso;
  const ingresoMesAnterior = tendencia[tendencia.length - 2].ingreso;

  const lista = (c: ClienteCrm): ClienteLista => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    total_comprado: c.total_comprado,
    dias_sin_comprar: c.dias_sin_comprar,
    compras_90_dias: c.compras_90_dias,
    saldo_pendiente: c.saldo_pendiente,
  });

  // Marketing
  const reactivar = conCompras
    .filter((c) => (c.dias_sin_comprar ?? 0) > 60)
    .sort((a, b) => b.total_comprado - a.total_comprado)
    .map(lista);
  const fidelizar = conCompras
    .filter((c) => c.compras_90_dias >= 3)
    .sort((a, b) => b.compras_90_dias - a.compras_90_dias || b.total_comprado - a.total_comprado)
    .map(lista);
  const enRiesgo = conCompras
    .filter((c) => c.compras >= 2 && (c.dias_sin_comprar ?? 0) > 20 && (c.dias_sin_comprar ?? 0) <= 60)
    .sort((a, b) => b.total_comprado - a.total_comprado)
    .map(lista);

  const cross = new Map<string, { compradores: Set<number>; unidades: number }>();
  for (const c of todas) {
    for (const it of c.items) {
      const f = cross.get(it.nombre) ?? { compradores: new Set<number>(), unidades: 0 };
      f.compradores.add(c.clienteId);
      f.unidades += it.cantidad;
      cross.set(it.nombre, f);
    }
  }
  const crossSell = [...cross.entries()]
    .map(([producto, f]) => ({ producto, compradores: f.compradores.size, unidades: f.unidades }))
    .sort((a, b) => b.compradores - a.compradores || b.unidades - a.unidades)
    .slice(0, 6);

  // Finanzas
  const aging: Record<string, { monto: number; ventas: number }> = {};
  for (const vf of DB.ventasFiado) {
    if (vf.saldoPendiente <= 0) continue;
    const dias = diasDesde(vf.createdAt);
    const k = dias <= 30 ? "0_30" : dias <= 60 ? "31_60" : dias <= 90 ? "61_90" : "mas_90";
    const f = aging[k] ?? { monto: 0, ventas: 0 };
    f.monto += vf.saldoPendiente;
    f.ventas += 1;
    aging[k] = f;
  }
  const deudores = clientes
    .filter((c) => c.saldo_pendiente > 0)
    .sort((a, b) => b.saldo_pendiente - a.saldo_pendiente)
    .map((c) => ({ id: c.id, nombre: c.nombre, telefono: c.telefono, saldo: c.saldo_pendiente, dias_sin_comprar: c.dias_sin_comprar }));
  const topN = (n: number) => {
    const suma = ranking.slice(0, n).reduce((s, c) => s + c.total_comprado, 0);
    return ingresoTotal ? pct1((100 * suma) / ingresoTotal) : 0;
  };
  const sucursales = new Map<string, { ingreso: number; compras: number }>();
  for (const c of todas) {
    const nombre = nombreSucursal(c.sucursalId) ?? "Cuenta corriente";
    const f = sucursales.get(nombre) ?? { ingreso: 0, compras: 0 };
    f.ingreso += c.total;
    f.compras += 1;
    sucursales.set(nombre, f);
  }

  // Liderazgo
  const hoy = hoyLocal();
  const hechos = seguimientos.filter((s) => s.hecho).length;
  const accionables = seguimientos.filter((s) => s.fecha_programada);
  const vencidos = accionables.filter((s) => !s.hecho && s.fecha_programada! < hoy).length;
  const responsables = new Map<string, { creados: number; hechos: number; pendientes: number }>();
  for (const s of seguimientos) {
    const f = responsables.get(s.creado_por) ?? { creados: 0, hechos: 0, pendientes: 0 };
    f.creados += 1;
    if (s.hecho) f.hechos += 1;
    else f.pendientes += 1;
    responsables.set(s.creado_por, f);
  }

  return {
    datos: {
      total_clientes: clientes.length,
      con_compras: conCompras.length,
      ingreso_total: ingresoTotal,
      compras_total: todas.length,
      ticket_promedio: todas.length ? Math.round(ingresoTotal / todas.length) : 0,
      ingreso_90: ingreso90,
      nuevos_30: conCompras.filter((c) => c.primera_compra && diasDesde(c.primera_compra) <= 30).length,
      segmentos,
      top_clientes: topClientes,
      pareto_80_clientes: pareto,
      tendencia_mensual: tendencia,
    },
    marketing: { reactivar, fidelizar, en_riesgo: enRiesgo, cross_sell: crossSell },
    finanzas: {
      deuda_total: deudores.reduce((s, d) => s + d.saldo, 0),
      clientes_con_deuda: deudores.length,
      aging,
      deudores,
      concentracion: { top5_pct: topN(5), top10_pct: topN(10) },
      por_sucursal: [...sucursales.entries()].map(([sucursal, f]) => ({ sucursal, ...f })).sort((a, b) => b.ingreso - a.ingreso),
    },
    liderazgo: {
      seguimientos: {
        total: seguimientos.length,
        hechos,
        pendientes: seguimientos.length - hechos,
        vencidos,
        cumplimiento_pct: seguimientos.length ? Math.round((100 * hechos) / seguimientos.length) : 0,
      },
      por_responsable: [...responsables.entries()].map(([responsable, f]) => ({ responsable, ...f })),
      agenda_vencida: vencidos,
      ingreso_mes: ingresoMes,
      ingreso_mes_anterior: ingresoMesAnterior,
    },
  };
}

export async function getCrmInteligencia(): Promise<CrmInteligencia> {
  return delay(calcularInteligencia(), 150);
}

const pesos = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/** Análisis "con IA" del panel: texto canned armado con los números calculados. */
export async function analizarCrmIa(): Promise<string> {
  const i = calcularInteligencia();
  const { datos, marketing, finanzas, liderazgo } = i;
  const var_mes =
    liderazgo.ingreso_mes_anterior > 0
      ? pct1((100 * (liderazgo.ingreso_mes - liderazgo.ingreso_mes_anterior)) / liderazgo.ingreso_mes_anterior)
      : null;
  const top = datos.top_clientes[0];
  const lineas: string[] = [];

  lineas.push("Resumen general");
  lineas.push(
    `Tenés ${datos.total_clientes} clientes cargados, ${datos.con_compras} con compras registradas. Facturaste ${pesos(datos.ingreso_total)} en ${datos.compras_total} compras (ticket promedio ${pesos(datos.ticket_promedio)}) y ${pesos(datos.ingreso_90)} en los últimos 90 días.`,
  );
  if (var_mes !== null) {
    lineas.push(
      `El mes en curso lleva ${pesos(liderazgo.ingreso_mes)}, ${var_mes >= 0 ? "un " + var_mes + "% más" : "un " + Math.abs(var_mes) + "% menos"} que el mes anterior (${pesos(liderazgo.ingreso_mes_anterior)}).`,
    );
  }
  if (top) {
    lineas.push(
      `Concentración: tu mejor cliente es ${top.nombre} (${top.pct}% de la facturación). Los 5 principales suman el ${finanzas.concentracion.top5_pct}%; con ${datos.pareto_80_clientes} cliente(s) cubrís el 80% del ingreso.`,
    );
  }

  lineas.push("");
  lineas.push("Marketing");
  lineas.push(
    `Hay ${marketing.reactivar.length} cliente(s) para reactivar (más de 60 días sin comprar), ${marketing.en_riesgo.length} en riesgo de enfriarse y ${marketing.fidelizar.length} frecuentes para fidelizar con beneficios.`,
  );
  if (marketing.reactivar[0]) {
    lineas.push(`Empezá por ${marketing.reactivar[0].nombre}: lleva ${marketing.reactivar[0].dias_sin_comprar} días sin comprar y compró ${pesos(marketing.reactivar[0].total_comprado)} en total.`);
  }
  if (marketing.cross_sell[0]) {
    lineas.push(`El producto más elegido es "${marketing.cross_sell[0].producto}" (${marketing.cross_sell[0].compradores} compradores): ideal para ofrecer como complemento.`);
  }

  lineas.push("");
  lineas.push("Finanzas");
  lineas.push(
    `Tenés ${pesos(finanzas.deuda_total)} por cobrar en ${finanzas.clientes_con_deuda} cliente(s).${finanzas.aging["mas_90"] ? ` ${pesos(finanzas.aging["mas_90"].monto)} tiene más de 90 días: conviene gestionarlo ya.` : ""}`,
  );
  if (finanzas.deudores[0]) {
    lineas.push(`Mayor deudor: ${finanzas.deudores[0].nombre} con ${pesos(finanzas.deudores[0].saldo)}.`);
  }

  lineas.push("");
  lineas.push("Equipo y seguimiento");
  lineas.push(
    `Cumplimiento de seguimientos: ${liderazgo.seguimientos.cumplimiento_pct}% (${liderazgo.seguimientos.hechos} de ${liderazgo.seguimientos.total}). Hay ${liderazgo.agenda_vencida} tarea(s) vencida(s) en la agenda que conviene resolver esta semana.`,
  );

  lineas.push("");
  lineas.push("Próximos pasos sugeridos: 1) cobrar la deuda más antigua, 2) contactar a los clientes a reactivar, 3) cerrar las tareas vencidas de la agenda.");

  return delay(lineas.join("\n"), 700);
}
