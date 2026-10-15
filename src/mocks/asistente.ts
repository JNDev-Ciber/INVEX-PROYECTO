/**
 * Asistente de IA de la demo: 100% determinístico, sin red. Las respuestas del
 * chat, las ofertas de la semana, el agente de decisiones y la lectura de
 * facturas se arman a partir de `DB`.
 */
import {
  DB,
  currentUser,
  delay,
  fail,
  haceDias,
  soloFecha,
  stockEn,
  stockTotal,
  sucursalActualId,
  uid,
  type MovimientoDb,
  type ProductoDb,
} from "@/mocks/db";

export type ChatRole = "user" | "assistant";

export type Propuesta = {
  id: string;
  tipo: "descuento" | "precio" | "precio_categoria";
  titulo: string;
  detalle: string;
  motivo: string;
  producto_id?: string;
  categoria?: string;
  porcentaje?: number;
  precio_nuevo?: number;
};

export type ChatMessage = {
  role: ChatRole;
  content: string;
  propuestas?: Propuesta[];
};

export type Semana = { inicio: string; fin: string };

export type OfertaPropuesta = {
  producto_id: string;
  nombre: string;
  categoria: string;
  stock: number;
  porcentaje: number;
  precio_lista: number;
  precio_oferta: number;
  margen_actual: number;
  margen_oferta: number;
  vendidas_30_dias: number;
  dias_sin_venta: number | null;
  motivo: string;
};

export type PropuestaOfertas = {
  semana: Semana;
  resumen: string;
  ofertas: OfertaPropuesta[];
};

export type OfertaVigente = {
  id: string;
  producto_id: string;
  nombre: string;
  stock: number;
  porcentaje: number;
  precio_lista: number;
  precio_oferta: number;
  margen_oferta: number;
  motivo: string;
  semana_inicio: string | null;
  resumen: string;
};

export type EstadoOfertasSemana = {
  configurada: boolean;
  semana: Semana;
  publicadas_esta_semana: boolean;
  vigentes: OfertaVigente[];
  resumen: string | null;
  semana_vigentes: string | null;
};

export type OfertaAPublicar = { producto_id: string; porcentaje: number; motivo: string };

// Agente de la bandeja de decisiones

export type TipoDecision = "reponer" | "descuento" | "precio" | "cobrar" | "transferir" | "recontactar";

export type DecisionAgente = {
  id: string;
  tipo: TipoDecision;
  prioridad: "alta" | "media" | "baja";
  titulo: string;
  detalle: string;
  motivo: string;
  estado: string;
  creada_en: string;
  resuelta_en: string | null;
  resuelta_por: string | null;
  resultado: string | null;
  destinatario: string | null;
  mensaje: string | null;
  whatsapp_url: string | null;
};

export type PasoAgente = { herramienta: string; resultado: string };

export type RevisionAgente = {
  id: string;
  origen: string;
  ejecutada_por: string | null;
  iniciada_en: string;
  terminada_en: string | null;
  estado: string;
  resumen: string;
  pasos: PasoAgente[];
  error: string | null;
};

export type EstadoAgente = {
  configurado: boolean;
  ultima_revision: RevisionAgente | null;
  proxima_automatica: string | null;
  pendientes: DecisionAgente[];
  para_comprar: DecisionAgente[];
  recientes: DecisionAgente[];
};

export type ResolucionDecision = "aprobar" | "rechazar" | "completar";

// Ingreso de mercadería con foto de la factura

export type ArchivoFactura = {
  media_type: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  data: string;
};

export type ProductoFactura = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string | null;
  stock: number;
  costo_actual: number;
  precio_venta: number;
  margen_actual: number;
};

export type LineaFactura = {
  id: string;
  descripcion: string;
  codigo_proveedor: string | null;
  confianza: "alta" | "media" | "baja";
  cantidad: number;
  costo_factura: number;
  producto: ProductoFactura | null;
  nombre_sugerido: string;
  categoria_sugerida: string | null;
  margen_objetivo: number;
  avisos: string[];
};

export type LecturaFactura = {
  proveedor_leido: { nombre: string; cuit: string | null };
  proveedor_id: string | null;
  numero: string;
  fecha: string | null;
  iva_discriminado: boolean;
  alicuota_iva: number;
  total_factura: number | null;
  lineas: LineaFactura[];
  avisos: string[];
  proveedores: { id: string; nombre: string }[];
  productos: ProductoFactura[];
  categorias: string[];
};

export type RenglonAConfirmar = {
  producto_id: string | null;
  nombre: string;
  categoria: string;
  cantidad: number;
  costo_unitario: number;
  precio_venta: number;
};

export type CupoIa = { usados: number; cupo: number; mes: string };

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const pesos = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function margenPct(precio: number, costo: number): number {
  return precio > 0 ? Math.round(((precio - costo) * 1000) / precio) / 10 : 0;
}

function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function semanaActual(): Semana {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { inicio: fechaLocal(lunes), fin: fechaLocal(domingo) };
}

function whatsappUrl(telefono: string | undefined | null, texto: string): string | null {
  let d = (telefono ?? "").replace(/\D/g, "");
  if (d.length < 8) return null;
  if (!d.startsWith("54")) {
    d = d.replace(/^0/, "");
    d = `549${d}`;
  }
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

function usuarioActual(): string {
  return currentUser()?.username ?? "vendedor1";
}

const DIA_MS = 86_400_000;

interface VentasProducto {
  vendidas30: number;
  ultimaVenta: string | null;
}

function ventasPorProducto(): Map<string, VentasProducto> {
  const mapa = new Map<string, VentasProducto>();
  const limite = Date.now() - 30 * DIA_MS;
  for (const m of DB.movimientos) {
    if (m.type !== "salida" || m.esTransferencia || !m.productId) continue;
    const f = mapa.get(m.productId) ?? { vendidas30: 0, ultimaVenta: null };
    if (new Date(m.date).getTime() >= limite) f.vendidas30 += m.quantity;
    if (!f.ultimaVenta || m.date > f.ultimaVenta) f.ultimaVenta = m.date;
    mapa.set(m.productId, f);
  }
  return mapa;
}

const diasDesde = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DIA_MS));

/** Productos con mucho stock y poca salida, mejores candidatos a oferta. */
function candidatosLiquidar(excluir: Set<string> = new Set()): Array<{ p: ProductoDb; ventas: VentasProducto }> {
  const ventas = ventasPorProducto();
  return DB.productos
    .filter((p) => p.activo && !p.discountActive && stockTotal(p) >= 6 && !excluir.has(p.id))
    .map((p) => ({ p, ventas: ventas.get(p.id) ?? { vendidas30: 0, ultimaVenta: null } }))
    .sort((a, b) => stockTotal(b.p) / (b.ventas.vendidas30 + 1) - stockTotal(a.p) / (a.ventas.vendidas30 + 1));
}

function porcentajeSugerido(p: ProductoDb): number {
  const m = margenPct(p.price, p.cost);
  if (m >= 35) return 15;
  if (m >= 28) return 10;
  return 5;
}

function precioConDescuento(p: ProductoDb, pct: number): number {
  return Math.round(p.price * (1 - pct / 100));
}

function aplicarDescuento(p: ProductoDb, pct: number) {
  p.discountActive = pct > 0;
  p.discountPercent = pct > 0 ? pct : 0;
}

// ---------------------------------------------------------------------------
// Cupo
// ---------------------------------------------------------------------------

export async function getCupoIa(): Promise<CupoIa | null> {
  const d = new Date();
  const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return delay({ usados: 12, cupo: 100, mes }, 150);
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

function respuestaStock(): { reply: string; propuestas: Propuesta[] } {
  const suc = sucursalActualId();
  const bajos = DB.productos
    .filter((p) => p.activo && stockEn(p, suc) <= p.minStock)
    .sort((a, b) => stockEn(a, suc) - stockEn(b, suc));
  const sucNombre = DB.sucursales.find((s) => s.id === suc)?.nombre ?? "la sucursal";
  if (bajos.length === 0) {
    return { reply: `Por ahora todo el stock de ${sucNombre} está por encima del mínimo. No hace falta reponer nada.`, propuestas: [] };
  }
  const lista = bajos
    .slice(0, 6)
    .map((p) => `• ${p.name}: ${stockEn(p, suc)} u. (mínimo ${p.minStock})`)
    .join("\n");
  const sinStock = bajos.filter((p) => stockEn(p, suc) === 0).length;
  return {
    reply:
      `En ${sucNombre} hay ${bajos.length} producto(s) en o por debajo del stock mínimo${sinStock ? `, ${sinStock} sin stock` : ""}:\n${lista}\n\n` +
      `Te recomiendo reponer primero los que están en cero. Podés pedirle al agente que prepare los pedidos a proveedores desde la pestaña "Agente".`,
    propuestas: [],
  };
}

function respuestaPrecios(texto: string): { reply: string; propuestas: Propuesta[] } {
  const propuestas: Propuesta[] = [];
  const categoria = DB.categorias.find((c) => {
    const raiz = normalizar(c.nombre).split(" ")[0].replace(/s$/, "");
    return raiz.length >= 3 && texto.includes(raiz);
  });
  const bajos = DB.productos
    .filter((p) => p.activo)
    .map((p) => ({ p, m: margenPct(p.price, p.cost) }))
    .sort((a, b) => a.m - b.m);
  const peor = bajos[0];
  let reply = `Los productos con menor margen son:\n${bajos
    .slice(0, 4)
    .map((x) => `• ${x.p.name}: ${x.m}% (costo ${pesos(x.p.cost)}, precio ${pesos(x.p.price)})`)
    .join("\n")}\n\n`;
  if (peor && peor.m < 35) {
    const nuevo = Math.ceil(peor.p.cost / (1 - 0.35) / 100) * 100;
    propuestas.push({
      id: uid("prop"),
      tipo: "precio",
      titulo: `Subir ${peor.p.name} a ${pesos(nuevo)}`,
      detalle: `Pasa de ${pesos(peor.p.price)} a ${pesos(nuevo)} (margen ${peor.m}% → 35%).`,
      motivo: "Es el producto con el margen más ajustado del catálogo.",
      producto_id: peor.p.id,
      precio_nuevo: nuevo,
    });
    reply += `Te propongo llevar ${peor.p.name} a un margen del 35%.`;
  }
  if (categoria) {
    propuestas.push({
      id: uid("prop"),
      tipo: "precio_categoria",
      titulo: `Ajustar ${categoria.nombre} un 5%`,
      detalle: `Aplica un aumento del 5% a todos los productos de ${categoria.nombre}.`,
      motivo: "Cubre la suba de costos de reposición.",
      categoria: categoria.nombre,
      porcentaje: 5,
    });
    reply += ` Y como mencionaste ${categoria.nombre.toLowerCase()}, también te dejo un ajuste general del 5% para esa categoría.`;
  }
  return { reply: reply.trim() + "\n\nRevisá las propuestas y aplicá las que quieras.", propuestas };
}

function respuestaOfertas(): { reply: string; propuestas: Propuesta[] } {
  const cands = candidatosLiquidar().slice(0, 2);
  if (cands.length === 0) return { reply: "No encuentro productos con exceso de stock para ofertar en este momento.", propuestas: [] };
  const propuestas = cands.map<Propuesta>(({ p, ventas }) => {
    const pct = porcentajeSugerido(p);
    return {
      id: uid("prop"),
      tipo: "descuento",
      titulo: `${pct}% de descuento en ${p.name}`,
      detalle: `Precio de ${pesos(p.price)} a ${pesos(precioConDescuento(p, pct))}. Margen resultante ${margenPct(precioConDescuento(p, pct), p.cost)}%.`,
      motivo: `Tenés ${stockTotal(p)} unidades y vendiste ${ventas.vendidas30} en los últimos 30 días.`,
      producto_id: p.id,
      porcentaje: pct,
    };
  });
  return {
    reply:
      `Estos productos tienen mucho stock y poca rotación, así que son buenos candidatos para una promoción:\n${propuestas
        .map((p) => `• ${p.titulo}`)
        .join("\n")}\n\nTambién podés armar toda la oferta de la semana desde la pestaña "Ofertas".`,
    propuestas,
  };
}

function respuestaDeuda(): { reply: string; propuestas: Propuesta[] } {
  const deudores = DB.clientes.filter((c) => c.saldoPendiente > 0).sort((a, b) => b.saldoPendiente - a.saldoPendiente);
  if (deudores.length === 0) return { reply: "No hay clientes con saldo pendiente. La cuenta corriente está al día.", propuestas: [] };
  const total = deudores.reduce((s, c) => s + c.saldoPendiente, 0);
  return {
    reply:
      `Hay ${deudores.length} cliente(s) con deuda por un total de ${pesos(total)}:\n${deudores
        .slice(0, 5)
        .map((c) => `• ${c.nombre}: ${pesos(c.saldoPendiente)}`)
        .join("\n")}\n\nEl agente puede dejarte listos los mensajes de cobro por WhatsApp en la pestaña "Agente".`,
    propuestas: [],
  };
}

function respuestaVentas(): { reply: string; propuestas: Propuesta[] } {
  const ahora = Date.now();
  const ventas = DB.movimientos.filter((m) => m.type === "salida" && !m.esTransferencia);
  const suma = (dias: number) =>
    ventas.filter((m) => ahora - new Date(m.date).getTime() <= dias * DIA_MS).reduce((s, m) => s + m.valor_total, 0);
  const porProducto = new Map<string, number>();
  for (const m of ventas) {
    if (ahora - new Date(m.date).getTime() > 30 * DIA_MS) continue;
    porProducto.set(m.productName, (porProducto.get(m.productName) ?? 0) + m.quantity);
  }
  const top = [...porProducto.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    reply:
      `Resumen de ventas: ${pesos(suma(7))} en los últimos 7 días y ${pesos(suma(30))} en los últimos 30.\n` +
      (top.length ? `Lo más vendido del mes:\n${top.map(([n, q]) => `• ${n}: ${q} u.`).join("\n")}` : "Todavía no hay ventas en el último mes."),
    propuestas: [],
  };
}

const AYUDA =
  "Hola, soy el asistente de INVEX. Puedo ayudarte con:\n" +
  "• Stock: qué conviene reponer.\n" +
  "• Precios y márgenes: te propongo ajustes que podés aplicar con un clic.\n" +
  "• Ofertas: qué productos conviene liquidar.\n" +
  "• Deudas de clientes y cobranzas.\n" +
  "• Resumen de ventas.\n\nProbá preguntando, por ejemplo: \"¿Qué stock me falta?\" o \"¿Qué productos puedo poner en oferta?\".";

export async function sendMessage(message: string, history: unknown[]) {
  const t = normalizar(message);
  let r: { reply: string; propuestas: Propuesta[] };
  if (/stock|inventario|reponer|falta|quedan|agot/.test(t)) r = respuestaStock();
  else if (/oferta|descuento|promo|liquidar|rebaja/.test(t)) r = respuestaOfertas();
  else if (/precio|costo|margen|aument|subir|ajust/.test(t)) r = respuestaPrecios(t);
  else if (/deuda|deben|cobrar|cobranza|fiado|cuenta corriente|moroso/.test(t)) r = respuestaDeuda();
  else if (/venta|vendi|factur|ingreso|ganancia|caja/.test(t)) r = respuestaVentas();
  else r = { reply: AYUDA, propuestas: [] };

  const nuevoHistorial = [...history, { role: "user", content: message }, { role: "assistant", content: r.reply }];
  return delay({ reply: r.reply, history: nuevoHistorial, propuestas: r.propuestas }, 600);
}

export async function aplicarPropuesta(propuesta: Propuesta): Promise<{ ok: true; mensaje: string }> {
  await delay(null, 500);
  if (propuesta.tipo === "descuento") {
    const p = DB.productos.find((x) => x.id === propuesta.producto_id);
    if (!p) fail("No encontré el producto de la propuesta");
    const pct = Number(propuesta.porcentaje ?? 0);
    if (!(pct > 0 && pct <= 90)) fail("El porcentaje de descuento no es válido");
    aplicarDescuento(p, pct);
    return { ok: true, mensaje: `Descuento del ${pct}% aplicado a ${p.name}.` };
  }
  if (propuesta.tipo === "precio") {
    const p = DB.productos.find((x) => x.id === propuesta.producto_id);
    if (!p) fail("No encontré el producto de la propuesta");
    const nuevo = Number(propuesta.precio_nuevo ?? 0);
    if (!(nuevo > 0)) fail("El precio nuevo no es válido");
    p.price = nuevo;
    return { ok: true, mensaje: `Precio de ${p.name} actualizado a ${pesos(nuevo)}.` };
  }
  const objetivo = normalizar(propuesta.categoria ?? "");
  const pct = Number(propuesta.porcentaje ?? 0);
  if (!objetivo || !pct) fail("La propuesta no indica categoría o porcentaje");
  const afectados = DB.productos.filter((p) => normalizar(p.category) === objetivo);
  if (afectados.length === 0) fail("No hay productos en esa categoría");
  for (const p of afectados) p.price = Math.round((p.price * (1 + pct / 100)) / 100) * 100;
  return { ok: true, mensaje: `Se ajustaron ${afectados.length} productos de ${propuesta.categoria} un ${pct}%.` };
}

// ---------------------------------------------------------------------------
// Ofertas de la semana
// ---------------------------------------------------------------------------

let ofertasVigentes: OfertaVigente[] = [];
let resumenVigentes: string | null = null;
let semanaVigentes: string | null = null;

function refrescarVigentes(): OfertaVigente[] {
  ofertasVigentes = ofertasVigentes.filter((o) => DB.productos.some((p) => p.id === o.producto_id && p.discountActive));
  return ofertasVigentes.map((o) => {
    const p = DB.productos.find((x) => x.id === o.producto_id)!;
    return {
      ...o,
      nombre: p.name,
      stock: stockTotal(p),
      porcentaje: p.discountPercent,
      precio_lista: p.price,
      precio_oferta: precioConDescuento(p, p.discountPercent),
      margen_oferta: margenPct(precioConDescuento(p, p.discountPercent), p.cost),
    };
  });
}

export async function getOfertasEstado(): Promise<EstadoOfertasSemana> {
  const vigentes = refrescarVigentes();
  const semana = semanaActual();
  return delay(
    {
      configurada: true,
      semana,
      publicadas_esta_semana: vigentes.length > 0 && semanaVigentes === semana.inicio,
      vigentes,
      resumen: vigentes.length ? resumenVigentes : null,
      semana_vigentes: vigentes.length ? semanaVigentes : null,
    },
    200,
  );
}

export async function proponerOfertas(): Promise<PropuestaOfertas> {
  const ventas = ventasPorProducto();
  const ofertas = candidatosLiquidar()
    .slice(0, 4)
    .map<OfertaPropuesta>(({ p, ventas: v }) => {
      const pct = porcentajeSugerido(p);
      const precioOferta = precioConDescuento(p, pct);
      return {
        producto_id: p.id,
        nombre: p.name,
        categoria: p.category,
        stock: stockTotal(p),
        porcentaje: pct,
        precio_lista: p.price,
        precio_oferta: precioOferta,
        margen_actual: margenPct(p.price, p.cost),
        margen_oferta: margenPct(precioOferta, p.cost),
        vendidas_30_dias: v.vendidas30,
        dias_sin_venta: ventas.get(p.id)?.ultimaVenta ? diasDesde(ventas.get(p.id)!.ultimaVenta!) : null,
        motivo: `Hay ${stockTotal(p)} unidades en stock y solo se vendieron ${v.vendidas30} en 30 días. Con ${pct}% de descuento conserva un margen del ${margenPct(precioOferta, p.cost)}%.`,
      };
    });
  const resumen =
    ofertas.length === 0
      ? "No encontré productos con exceso de stock para la oferta de esta semana."
      : `Seleccioné ${ofertas.length} productos con stock alto y baja rotación para la semana. Los descuentos se calcularon para mantener el margen por encima del ${Math.min(...ofertas.map((o) => o.margen_oferta))}%.`;
  return delay({ semana: semanaActual(), resumen, ofertas }, 800);
}

export async function publicarOfertas(datos: { resumen: string; ofertas: OfertaAPublicar[] }): Promise<{ ok: true; mensaje: string }> {
  if (datos.ofertas.length === 0) fail("Elegí al menos una oferta para publicar");
  // Se retiran las ofertas de la semana anterior antes de publicar las nuevas.
  for (const o of ofertasVigentes) {
    const p = DB.productos.find((x) => x.id === o.producto_id);
    if (p) aplicarDescuento(p, 0);
  }
  const semana = semanaActual();
  const nuevas: OfertaVigente[] = [];
  for (const o of datos.ofertas) {
    const p = DB.productos.find((x) => x.id === o.producto_id);
    if (!p) continue;
    if (!(o.porcentaje > 0 && o.porcentaje <= 90)) fail(`El porcentaje de ${p.name} no es válido`);
    aplicarDescuento(p, o.porcentaje);
    const precioOferta = precioConDescuento(p, o.porcentaje);
    nuevas.push({
      id: uid("oferta"),
      producto_id: p.id,
      nombre: p.name,
      stock: stockTotal(p),
      porcentaje: o.porcentaje,
      precio_lista: p.price,
      precio_oferta: precioOferta,
      margen_oferta: margenPct(precioOferta, p.cost),
      motivo: o.motivo,
      semana_inicio: semana.inicio,
      resumen: datos.resumen,
    });
  }
  ofertasVigentes = nuevas;
  resumenVigentes = datos.resumen;
  semanaVigentes = semana.inicio;
  return delay({ ok: true as const, mensaje: `Se publicaron ${nuevas.length} ofertas para la semana.` }, 500);
}

export async function retirarOfertas(ofertaId?: string): Promise<{ ok: true; mensaje: string }> {
  const retirar = ofertaId ? ofertasVigentes.filter((o) => o.id === ofertaId) : [...ofertasVigentes];
  if (retirar.length === 0) fail("No hay ofertas para retirar");
  for (const o of retirar) {
    const p = DB.productos.find((x) => x.id === o.producto_id);
    if (p) aplicarDescuento(p, 0);
  }
  ofertasVigentes = ofertasVigentes.filter((o) => !retirar.includes(o));
  return delay({ ok: true as const, mensaje: retirar.length === 1 ? `Se retiró la oferta de ${retirar[0].nombre}.` : "Se retiraron todas las ofertas." }, 300);
}

// ---------------------------------------------------------------------------
// Agente de decisiones
// ---------------------------------------------------------------------------

interface CargaDecision {
  clave: string;
  productoId?: string;
  porcentaje?: number;
  precioNuevo?: number;
}

let decisiones: DecisionAgente[] = [];
const cargas = new Map<string, CargaDecision>();
let ultimaRevision: RevisionAgente | null = null;
let agenteIniciado = false;

const PROVEEDOR_POR_CATEGORIA: Record<string, string> = {
  Heladeras: "prov-2",
  Lavarropas: "prov-1",
  Televisores: "prov-3",
  "Aires Acondicionados": "prov-3",
  Cocinas: "prov-1",
  "Pequeños Electrodomésticos": "prov-4",
};

type Candidata = Omit<DecisionAgente, "id" | "estado" | "creada_en" | "resuelta_en" | "resuelta_por" | "resultado"> & CargaDecision;

function candidatasReponer(): Candidata[] {
  const suc = sucursalActualId();
  return DB.productos
    .filter((p) => p.activo && stockEn(p, suc) <= p.minStock)
    .sort((a, b) => stockEn(a, suc) - stockEn(b, suc))
    .map((p) => {
      const stock = stockEn(p, suc);
      const cantidad = Math.max(p.minStock * 2 - stock, 2);
      const prov = DB.proveedores.find((v) => v.id === PROVEEDOR_POR_CATEGORIA[p.category]) ?? DB.proveedores[0];
      const mensaje = `Hola ${prov.nombre}, necesito reponer ${cantidad} unidades de ${p.name} (${p.code}). ¿Me pasan precio y plazo de entrega? Gracias.`;
      return {
        clave: `reponer:${p.id}`,
        productoId: p.id,
        tipo: "reponer" as const,
        prioridad: stock === 0 ? ("alta" as const) : ("media" as const),
        titulo: `Reponer ${cantidad} u. de ${p.name}`,
        detalle: `Stock actual ${stock} (mínimo ${p.minStock}). Último costo ${pesos(p.cost)} por unidad, aprox. ${pesos(p.cost * cantidad)} en total.`,
        motivo: stock === 0 ? "Está sin stock y es un producto que se vende." : "Está por debajo del stock mínimo.",
        destinatario: prov.nombre,
        mensaje,
        whatsapp_url: whatsappUrl(prov.telefono, mensaje),
      };
    });
}

function candidatasCobrar(): Candidata[] {
  return DB.clientes
    .filter((c) => c.saldoPendiente > 0)
    .sort((a, b) => b.saldoPendiente - a.saldoPendiente)
    .map((c) => {
      const mensaje = `Hola ${c.nombre.split(" ")[0]}, te escribimos de INVEX para recordarte que tenés un saldo pendiente de ${pesos(c.saldoPendiente)}. ¿Cuándo podés pasar a abonarlo? ¡Gracias!`;
      return {
        clave: `cobrar:${c.id}`,
        tipo: "cobrar" as const,
        prioridad: c.saldoPendiente > 1_000_000 ? ("alta" as const) : ("media" as const),
        titulo: `Cobrar ${pesos(c.saldoPendiente)} a ${c.nombre}`,
        detalle: `Saldo pendiente de ${pesos(c.saldoPendiente)} en cuenta corriente.`,
        motivo: "Tiene ventas fiadas sin cancelar hace semanas.",
        destinatario: c.nombre,
        mensaje,
        whatsapp_url: whatsappUrl(c.telefono, mensaje),
      };
    });
}

function candidatasDescuento(): Candidata[] {
  return candidatosLiquidar().map(({ p, ventas }) => {
    const pct = porcentajeSugerido(p);
    return {
      clave: `descuento:${p.id}`,
      productoId: p.id,
      porcentaje: pct,
      tipo: "descuento" as const,
      prioridad: "baja" as const,
      titulo: `Descuento del ${pct}% en ${p.name}`,
      detalle: `Pasa de ${pesos(p.price)} a ${pesos(precioConDescuento(p, pct))}. Margen resultante ${margenPct(precioConDescuento(p, pct), p.cost)}%.`,
      motivo: `${stockTotal(p)} unidades en stock y solo ${ventas.vendidas30} vendidas en 30 días.`,
      destinatario: null,
      mensaje: null,
      whatsapp_url: null,
    };
  });
}

function candidatasPrecio(): Candidata[] {
  return DB.productos
    .filter((p) => p.activo && margenPct(p.price, p.cost) < 30)
    .sort((a, b) => margenPct(a.price, a.cost) - margenPct(b.price, b.cost))
    .map((p) => {
      const nuevo = Math.ceil(p.cost / (1 - 0.35) / 100) * 100;
      return {
        clave: `precio:${p.id}`,
        productoId: p.id,
        precioNuevo: nuevo,
        tipo: "precio" as const,
        prioridad: "media" as const,
        titulo: `Subir ${p.name} a ${pesos(nuevo)}`,
        detalle: `Precio actual ${pesos(p.price)}, margen ${margenPct(p.price, p.cost)}%. Con el nuevo precio el margen sería 35%.`,
        motivo: "El margen quedó por debajo del 30% mínimo recomendado.",
        destinatario: null,
        mensaje: null,
        whatsapp_url: null,
      };
    });
}

function candidatasRecontactar(): Candidata[] {
  const ultima = new Map<number, string>();
  for (const m of DB.movimientos) {
    if (m.type === "salida" && m.clienteId != null && (!ultima.has(m.clienteId) || m.date > ultima.get(m.clienteId)!)) ultima.set(m.clienteId, m.date);
  }
  for (const v of DB.ventasFiado) {
    if (!ultima.has(v.clienteId) || v.createdAt > ultima.get(v.clienteId)!) ultima.set(v.clienteId, v.createdAt);
  }
  return DB.clientes
    .filter((c) => ultima.has(c.id) && diasDesde(ultima.get(c.id)!) > 45)
    .sort((a, b) => diasDesde(ultima.get(b.id)!) - diasDesde(ultima.get(a.id)!))
    .map((c) => {
      const dias = diasDesde(ultima.get(c.id)!);
      const mensaje = `Hola ${c.nombre.split(" ")[0]}, hace tiempo que no te vemos por INVEX. Tenemos promociones en electrodomésticos esta semana, ¿te mandamos las novedades?`;
      return {
        clave: `recontactar:${c.id}`,
        tipo: "recontactar" as const,
        prioridad: "baja" as const,
        titulo: `Recontactar a ${c.nombre}`,
        detalle: `Última compra hace ${dias} días.`,
        motivo: "Era cliente activo y dejó de comprar; un mensaje a tiempo suele reactivarlo.",
        destinatario: c.nombre,
        mensaje,
        whatsapp_url: whatsappUrl(c.telefono, mensaje),
      };
    });
}

function crearDecision(c: Candidata, creada: string): DecisionAgente {
  const id = uid("dec");
  cargas.set(id, { clave: c.clave, productoId: c.productoId, porcentaje: c.porcentaje, precioNuevo: c.precioNuevo });
  return {
    id,
    tipo: c.tipo,
    prioridad: c.prioridad,
    titulo: c.titulo,
    detalle: c.detalle,
    motivo: c.motivo,
    estado: "pendiente",
    creada_en: creada,
    resuelta_en: null,
    resuelta_por: null,
    resultado: null,
    destinatario: c.destinatario,
    mensaje: c.mensaje,
    whatsapp_url: c.whatsapp_url,
  };
}

function iniciarAgente() {
  if (agenteIniciado) return;
  agenteIniciado = true;
  const creada = haceDias(0, 7, 30);
  const primeras = [candidatasReponer()[0], candidatasCobrar()[0], candidatasDescuento()[0], candidatasRecontactar()[0]].filter(
    (c): c is Candidata => Boolean(c),
  );
  decisiones = primeras.map((c) => crearDecision(c, creada));
  ultimaRevision = {
    id: uid("rev"),
    origen: "automatica",
    ejecutada_por: null,
    iniciada_en: creada,
    terminada_en: creada,
    estado: "ok",
    resumen: `Revisión diaria: encontré ${decisiones.length} cosas para decidir (reposición, cobranza, oferta y recontacto).`,
    pasos: [
      { herramienta: "Stock", resultado: "Revisé el stock contra los mínimos de cada producto." },
      { herramienta: "Ventas", resultado: "Analicé las ventas de los últimos 30 días y la rotación." },
      { herramienta: "Cuentas corrientes", resultado: "Revisé los saldos pendientes de clientes." },
    ],
    error: null,
  };
}

function haySimilar(clave: string) {
  return [...cargas.values()].some((c) => c.clave === clave);
}

function estadoAgente(): EstadoAgente {
  iniciarAgente();
  const orden = { alta: 0, media: 1, baja: 2 } as const;
  const pendientes = decisiones
    .filter((d) => d.estado === "pendiente")
    .sort((a, b) => orden[a.prioridad] - orden[b.prioridad] || b.creada_en.localeCompare(a.creada_en));
  const paraComprar = decisiones.filter((d) => d.tipo === "reponer" && d.estado === "aprobada");
  const recientes = decisiones
    .filter((d) => d.estado !== "pendiente" && !(d.tipo === "reponer" && d.estado === "aprobada"))
    .sort((a, b) => (b.resuelta_en ?? "").localeCompare(a.resuelta_en ?? ""));
  const proxima = new Date();
  proxima.setDate(proxima.getDate() + 1);
  proxima.setHours(7, 30, 0, 0);
  return {
    configurado: true,
    ultima_revision: ultimaRevision,
    proxima_automatica: proxima.toISOString(),
    pendientes,
    para_comprar: paraComprar,
    recientes,
  };
}

export async function getAgenteEstado(): Promise<EstadoAgente> {
  return delay(JSON.parse(JSON.stringify(estadoAgente())) as EstadoAgente, 200);
}

export async function revisarNegocio(): Promise<{ ok: true; resumen: string; pasos: PasoAgente[]; decisiones: DecisionAgente[] }> {
  iniciarAgente();
  await delay(null, 1200);
  const iniciada = new Date().toISOString();
  const reponer = candidatasReponer();
  const cobrar = candidatasCobrar();
  const descuento = candidatasDescuento();
  const precio = candidatasPrecio();
  const recontactar = candidatasRecontactar();

  const nuevas: DecisionAgente[] = [];
  const agregar = (lista: Candidata[], max: number) => {
    for (const c of lista.filter((x) => !haySimilar(x.clave)).slice(0, max)) nuevas.push(crearDecision(c, iniciada));
  };
  agregar(reponer, 2);
  agregar(cobrar, 1);
  agregar(descuento, 1);
  agregar(precio, 1);
  agregar(recontactar, 1);
  decisiones = [...nuevas, ...decisiones];

  const pasos: PasoAgente[] = [
    { herramienta: "Stock", resultado: `${reponer.length} producto(s) en o bajo el mínimo en ${DB.sucursales.find((s) => s.id === sucursalActualId())?.nombre ?? "la sucursal"}.` },
    { herramienta: "Rotación", resultado: `${descuento.length} producto(s) con exceso de stock y poca salida.` },
    { herramienta: "Márgenes", resultado: `${precio.length} producto(s) con margen menor al 30%.` },
    { herramienta: "Cuentas corrientes", resultado: `${cobrar.length} cliente(s) con saldo pendiente.` },
    { herramienta: "Clientes", resultado: `${recontactar.length} cliente(s) sin comprar hace más de 45 días.` },
  ];
  const resumen =
    nuevas.length === 0
      ? "Revisé todo el negocio y no encontré nada nuevo: las decisiones anteriores siguen vigentes."
      : `Revisé stock, rotación, márgenes y cuentas corrientes. Dejé ${nuevas.length} decisión(es) nueva(s) para que apruebes o rechaces.`;

  ultimaRevision = {
    id: uid("rev"),
    origen: "manual",
    ejecutada_por: usuarioActual(),
    iniciada_en: iniciada,
    terminada_en: new Date().toISOString(),
    estado: "ok",
    resumen,
    pasos,
    error: null,
  };
  return { ok: true, resumen, pasos, decisiones: nuevas };
}

export async function resolverDecision(
  decisionId: string,
  resolucion: ResolucionDecision,
): Promise<{ ok: true; mensaje: string; whatsapp_url: string | null }> {
  iniciarAgente();
  await delay(null, 400);
  const d = decisiones.find((x) => x.id === decisionId);
  if (!d) fail("No encontré la decisión");
  const carga = cargas.get(d.id);
  const ahora = new Date().toISOString();
  const cerrar = (estado: string, resultado: string) => {
    d.estado = estado;
    d.resuelta_en = ahora;
    d.resuelta_por = usuarioActual();
    d.resultado = resultado;
    return { ok: true as const, mensaje: resultado, whatsapp_url: d.whatsapp_url };
  };

  if (resolucion === "completar") {
    if (d.tipo !== "reponer") fail("Solo las reposiciones se pueden marcar como compradas");
    return cerrar("completada", "Marcaste la compra como realizada.");
  }
  if (d.estado !== "pendiente") fail("Esta decisión ya fue resuelta");
  if (resolucion === "rechazar") return { ...cerrar("rechazada", "Decisión rechazada. El agente no la va a volver a proponer."), whatsapp_url: null };

  switch (d.tipo) {
    case "descuento": {
      const p = DB.productos.find((x) => x.id === carga?.productoId);
      if (!p) fail("No encontré el producto");
      aplicarDescuento(p, carga?.porcentaje ?? 10);
      return cerrar("aplicada", `Descuento del ${carga?.porcentaje ?? 10}% aplicado a ${p.name}.`);
    }
    case "precio": {
      const p = DB.productos.find((x) => x.id === carga?.productoId);
      if (!p || !carga?.precioNuevo) fail("No encontré el producto");
      p.price = carga.precioNuevo;
      return cerrar("aplicada", `Precio de ${p.name} actualizado a ${pesos(carga.precioNuevo)}.`);
    }
    case "reponer":
      return cerrar("aprobada", "Quedó en \"Para comprar\". Pedilo por WhatsApp o cargá la factura cuando llegue la mercadería.");
    case "cobrar":
    case "recontactar":
      return cerrar("aprobada", "Mensaje listo para enviar por WhatsApp.");
    default:
      return cerrar("aprobada", "Decisión aprobada.");
  }
}

// ---------------------------------------------------------------------------
// Ingreso de mercadería con foto de factura
// ---------------------------------------------------------------------------

function aProductoFactura(p: ProductoDb): ProductoFactura {
  return {
    id: p.id,
    codigo: p.code,
    nombre: p.name,
    categoria: p.category,
    stock: stockEn(p, sucursalActualId()),
    costo_actual: p.cost,
    precio_venta: p.price,
    margen_actual: margenPct(p.price, p.cost),
  };
}

export async function leerFactura(archivo: ArchivoFactura): Promise<LecturaFactura> {
  void archivo; // No hay OCR real: la lectura es siempre la misma.
  const proveedor = DB.proveedores.find((v) => v.activo) ?? null;
  const productos = DB.productos.filter((p) => p.activo);
  const buscar = (code: string) => productos.find((p) => p.code === code) ?? null;

  // costo en la factura sin IVA, con un aumento sobre el costo actual.
  const costoFactura = (p: ProductoDb, suba: number) => Math.round((p.cost * (1 + suba)) / 1.21 / 100) * 100;
  const lineas: LineaFactura[] = [];
  const existentes: Array<[string, number, number, "alta" | "media" | "baja"]> = [
    ["TV-002", 6, 0.05, "alta"],
    ["LAV-001", 4, 0.08, "alta"],
    ["PEQ-004", 12, 0, "media"],
  ];
  existentes.forEach(([code, cantidad, suba, confianza], i) => {
    const p = buscar(code);
    if (!p) return;
    const costo = costoFactura(p, suba);
    lineas.push({
      id: `l${i + 1}`,
      descripcion: p.name.toUpperCase(),
      codigo_proveedor: `CE-${p.code.replace("-", "")}`,
      confianza,
      cantidad,
      costo_factura: costo,
      producto: aProductoFactura(p),
      nombre_sugerido: p.name,
      categoria_sugerida: p.category.toUpperCase(),
      margen_objetivo: margenPct(p.price, p.cost),
      avisos: suba > 0 ? [`El costo subió ${Math.round(suba * 100)}% respecto del último ingreso.`] : [],
    });
  });
  const categoriaNueva = DB.categorias.find((c) => c.nombre.startsWith("Peque"))?.nombre ?? DB.categorias[0]?.nombre ?? "";
  lineas.push({
    id: `l${lineas.length + 1}`,
    descripcion: "CAFETERA EXPRESS 15 BARES INOX",
    codigo_proveedor: "CE-CAF15",
    confianza: "baja",
    cantidad: 8,
    costo_factura: 52000,
    producto: null,
    nombre_sugerido: "Cafetera Express 15 Bares Inox",
    categoria_sugerida: categoriaNueva.toUpperCase(),
    margen_objetivo: 35,
    avisos: ["No encontré este producto en el inventario: se va a crear uno nuevo si lo dejás tildado."],
  });

  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.costo_factura, 0);
  return delay(
    {
      proveedor_leido: { nombre: proveedor?.nombre ?? "Distribuidora Cuyo Electro", cuit: proveedor?.cuit ?? null },
      proveedor_id: proveedor?.id ?? null,
      numero: "A-0003-00012457",
      fecha: soloFecha(haceDias(1)),
      iva_discriminado: true,
      alicuota_iva: 21,
      total_factura: Math.round(subtotal * 1.21),
      lineas,
      avisos: ["Lectura de demostración: revisá cantidades y costos antes de confirmar."],
      proveedores: DB.proveedores.filter((v) => v.activo).map((v) => ({ id: v.id, nombre: v.nombre })),
      productos: productos.map(aProductoFactura),
      categorias: DB.categorias.map((c) => c.nombre.toUpperCase()),
    },
    800,
  );
}

function codigoNuevo(categoria: string): string {
  const prefijo = normalizar(categoria).replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "NUE";
  const n = DB.productos.filter((p) => p.code.startsWith(`${prefijo}-`)).length + 1;
  return `${prefijo}-${String(n).padStart(3, "0")}`;
}

export async function confirmarFactura(datos: {
  proveedor_id: string | null;
  numero: string;
  items: RenglonAConfirmar[];
}): Promise<{ ok: true; mensaje: string }> {
  await delay(null, 600);
  if (datos.items.length === 0) fail("No hay renglones para ingresar");
  const sucursalId = sucursalActualId();
  const user = currentUser();
  const ahora = new Date().toISOString();
  const movimientos: MovimientoDb[] = [];
  const detalles: Array<{ productoId: string; nombre: string; cantidad: number; precioUnitario: number }> = [];
  let nuevos = 0;
  let unidades = 0;
  let total = 0;
  let n = DB.productos.reduce((max, p) => Math.max(max, Number(p.id.replace(/\D/g, "")) || 0), 0);

  for (const it of datos.items) {
    if (!(it.cantidad > 0) || !(it.costo_unitario > 0)) fail("Hay renglones con cantidad o costo inválido");
    let p = it.producto_id ? DB.productos.find((x) => x.id === it.producto_id) : undefined;
    if (it.producto_id && !p) fail("Uno de los productos ya no existe");
    if (!p) {
      if (!it.nombre.trim()) fail("Falta el nombre de un producto nuevo");
      n += 1;
      const cat = DB.categorias.find((c) => normalizar(c.nombre) === normalizar(it.categoria));
      const categoria = cat?.nombre ?? (it.categoria.trim() || "Sin categoría");
      const stock: Record<string, number> = {};
      for (const s of DB.sucursales) stock[s.id] = 0;
      p = {
        id: `prod-${String(n).padStart(3, "0")}`,
        code: codigoNuevo(categoria),
        name: it.nombre.trim(),
        category: categoria,
        subcategory: "",
        price: it.precio_venta,
        cost: it.costo_unitario,
        stock,
        minStock: 3,
        description: "",
        imageUrl: "",
        barcode: `779${String(Date.now() + n).slice(-10)}`,
        discountActive: false,
        discountPercent: 0,
        activo: true,
      };
      DB.productos.push(p);
      nuevos += 1;
    }
    const antes = stockEn(p, sucursalId);
    p.stock[sucursalId] = antes + it.cantidad;
    p.cost = it.costo_unitario;
    p.price = it.precio_venta;
    unidades += it.cantidad;
    total += it.cantidad * it.costo_unitario;
    detalles.push({ productoId: p.id, nombre: p.name, cantidad: it.cantidad, precioUnitario: it.costo_unitario });
    movimientos.push({
      id: uid("mov"),
      productId: p.id,
      productName: p.name,
      productCode: p.code,
      type: "entrada",
      esTransferencia: false,
      quantity: it.cantidad,
      reason: `Ingreso de mercadería - Factura ${datos.numero || "s/n"}`,
      date: ahora,
      previousQuantity: antes,
      newQuantity: antes + it.cantidad,
      valor_total: it.cantidad * it.costo_unitario,
      metodoPago: null,
      usuarioId: user?.id ?? null,
      usuarioNombre: user?.username ?? null,
      sucursalId,
      clienteId: null,
      ventaId: null,
    });
  }
  DB.movimientos.unshift(...movimientos);

  // La factura queda como deuda con el proveedor.
  if (datos.proveedor_id) {
    const prov = DB.proveedores.find((v) => v.id === datos.proveedor_id);
    if (prov) {
      DB.comprasProveedor.push({
        id: uid("compra"),
        proveedorId: prov.id,
        fecha: soloFecha(ahora),
        total,
        saldoPendiente: total,
        concepto: `Factura ${datos.numero || "s/n"}`,
        detalles,
        createdAt: ahora,
      });
      prov.saldoPendiente += total;
    }
  }

  // Las reposiciones del agente de esos productos quedan completadas.
  iniciarAgente();
  const ids = new Set(detalles.map((d) => d.productoId));
  for (const d of decisiones) {
    const carga = cargas.get(d.id);
    if (d.tipo === "reponer" && (d.estado === "pendiente" || d.estado === "aprobada") && carga?.productoId && ids.has(carga.productoId)) {
      d.estado = "completada";
      d.resuelta_en = ahora;
      d.resuelta_por = usuarioActual();
      d.resultado = "Se cargó la factura con esta mercadería.";
    }
  }

  return {
    ok: true,
    mensaje: `Ingresaron ${unidades} unidades de ${detalles.length} producto(s)${nuevos ? ` (${nuevos} nuevo${nuevos === 1 ? "" : "s"})` : ""} por ${pesos(total)}.${datos.proveedor_id ? " Quedó registrada la deuda con el proveedor." : ""}`,
  };
}
