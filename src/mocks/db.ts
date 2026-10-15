/**
 * Base de datos 100% en memoria para la demo. No hay backend: todo lo que
 * antes salía de Supabase / Edge Functions / Cloudinary vive acá y se
 * reinicia al recargar la página.
 *
 * Los módulos de `src/mocks/*.ts` leen y escriben sobre `DB`.
 */
import { useSucursalStore } from "@/app/stores/sucursal.store";

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Simula la latencia de red para que la UI muestre sus estados de carga. */
export function delay<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function fail(message: string): never {
  throw new Error(message);
}

let uidCounter = 1000;
export function uid(prefix = "id"): string {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

export function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

/** Fecha ISO de hace `dias` días a la `hora` indicada (hora local). */
export function haceDias(dias: number, hora = 12, minutos = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, minutos, 0, 0);
  return d.toISOString();
}

export function soloFecha(iso: string): string {
  return iso.slice(0, 10);
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// Generador pseudoaleatorio determinístico: la demo siempre arranca igual.
let seed = 20240607;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

// ---------------------------------------------------------------------------
// Tipos de las tablas
// ---------------------------------------------------------------------------

export interface SucursalDb {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  punto_venta_arca: number | null;
  es_principal: boolean;
  activa: boolean;
}

export interface UsuarioDb {
  id: string;
  username: string;
  password: string;
  rol: "caja" | "vendedor" | string;
  sucursal_id: string | null;
}

export interface CategoriaDb {
  id: number;
  nombre: string;
}

export interface SubcategoriaDb {
  id: number;
  nombre: string;
  categoria_id: number;
}

export interface ProductoDb {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  cost: number;
  /** Stock por sucursal (id de sucursal -> unidades). */
  stock: Record<string, number>;
  minStock: number;
  description: string;
  imageUrl: string;
  barcode: string;
  discountActive: boolean;
  discountPercent: number;
  activo: boolean;
}

export interface ClienteDb {
  id: number;
  nombre: string;
  telefono?: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  saldoPendiente: number;
}

export interface VentaFiadoDetalleDb {
  id: number;
  ventaFiadoId: number;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  pagado: boolean;
  pagadoEn?: string;
}

export interface VentaFiadoDb {
  id: number;
  clienteId: number;
  fecha: string;
  total: number;
  saldoPendiente: number;
  detalles: VentaFiadoDetalleDb[];
  createdAt: string;
}

export interface PagoDb {
  id: number;
  cliente_id: number;
  venta_fiado_id: number | null;
  monto: number;
  fecha: string;
}

export interface ProveedorDb {
  id: string;
  nombre: string;
  telefono?: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  saldoPendiente: number;
  activo: boolean;
}

export interface CompraProveedorDb {
  id: string;
  proveedorId: string;
  fecha: string;
  total: number;
  saldoPendiente: number;
  concepto?: string;
  detalles: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }> | null;
  createdAt: string;
}

export interface PagoProveedorDb {
  id: string;
  proveedorId: string;
  compraId: string | null;
  monto: number;
  fecha: string;
  concepto?: string;
}

export interface MovimientoDb {
  id: string;
  productId: string | null;
  productName: string;
  productCode: string;
  type: "entrada" | "salida";
  esTransferencia: boolean;
  quantity: number;
  reason: string;
  /** ISO */
  date: string;
  previousQuantity: number;
  newQuantity: number;
  valor_total: number;
  metodoPago: string | null;
  usuarioId: string | null;
  usuarioNombre: string | null;
  sucursalId: string;
  clienteId: number | null;
  /** Agrupa los renglones de una misma venta. */
  ventaId: string | null;
}

// ---------------------------------------------------------------------------
// Semillas
// ---------------------------------------------------------------------------

export const SUC_CENTRAL = "suc-central";
export const SUC_NORTE = "suc-norte";

const sucursales: SucursalDb[] = [
  {
    id: SUC_CENTRAL,
    nombre: "Casa Central",
    direccion: "Av. San Martín 1250, Mendoza",
    telefono: "261 555-0101",
    punto_venta_arca: 1,
    es_principal: true,
    activa: true,
  },
  {
    id: SUC_NORTE,
    nombre: "Sucursal Norte",
    direccion: "Ruta 40 Km 12, Las Heras",
    telefono: "261 555-0202",
    punto_venta_arca: 2,
    es_principal: false,
    activa: true,
  },
];

/** Únicos usuarios de la demo. */
const usuarios: UsuarioDb[] = [
  { id: "usr-vendedor1", username: "vendedor1", password: "vendedor1", rol: "vendedor", sucursal_id: SUC_CENTRAL },
  { id: "usr-caja1", username: "caja1", password: "caja1", rol: "caja", sucursal_id: SUC_CENTRAL },
];

const categorias: CategoriaDb[] = [
  { id: 1, nombre: "Heladeras" },
  { id: 2, nombre: "Lavarropas" },
  { id: 3, nombre: "Televisores" },
  { id: 4, nombre: "Aires Acondicionados" },
  { id: 5, nombre: "Cocinas" },
  { id: 6, nombre: "Pequeños Electrodomésticos" },
];

const subcategorias: SubcategoriaDb[] = [
  { id: 1, nombre: "No Frost", categoria_id: 1 },
  { id: 2, nombre: "Cíclica", categoria_id: 1 },
  { id: 3, nombre: "Carga Frontal", categoria_id: 2 },
  { id: 4, nombre: "Carga Superior", categoria_id: 2 },
  { id: 5, nombre: "Smart TV", categoria_id: 3 },
  { id: 6, nombre: "Split Frío/Calor", categoria_id: 4 },
  { id: 7, nombre: "Split Frío", categoria_id: 4 },
  { id: 8, nombre: "A Gas", categoria_id: 5 },
  { id: 9, nombre: "Cocción", categoria_id: 6 },
  { id: 10, nombre: "Limpieza", categoria_id: 6 },
];

type ProductoSeed = [
  code: string,
  name: string,
  category: string,
  subcategory: string,
  cost: number,
  price: number,
  stockCentral: number,
  stockNorte: number,
  minStock: number,
];

const PRODUCTOS_SEED: ProductoSeed[] = [
  ["HEL-001", "Heladera No Frost 380L Inox", "Heladeras", "No Frost", 780000, 1090000, 8, 4, 3],
  ["HEL-002", "Heladera Cíclica 290L Blanca", "Heladeras", "Cíclica", 520000, 729000, 12, 6, 4],
  ["HEL-003", "Heladera Side by Side 560L", "Heladeras", "No Frost", 1350000, 1899000, 2, 1, 2],
  ["LAV-001", "Lavarropas Carga Frontal 8kg", "Lavarropas", "Carga Frontal", 610000, 849000, 9, 5, 3],
  ["LAV-002", "Lavarropas Carga Superior 10kg", "Lavarropas", "Carga Superior", 540000, 759000, 6, 3, 3],
  ["LAV-003", "Lavasecarropas 9/6kg Inverter", "Lavarropas", "Carga Frontal", 890000, 1249000, 1, 2, 2],
  ["TV-001", 'Smart TV LED 32" HD', "Televisores", "Smart TV", 190000, 269000, 15, 8, 5],
  ["TV-002", 'Smart TV LED 43" Full HD', "Televisores", "Smart TV", 310000, 439000, 11, 6, 4],
  ["TV-003", 'Smart TV 55" 4K UHD', "Televisores", "Smart TV", 520000, 729000, 7, 3, 3],
  ["TV-004", 'Smart TV 65" 4K QLED', "Televisores", "Smart TV", 890000, 1249000, 0, 2, 2],
  ["AIR-001", "Aire Split 2250 Frigorías Frío/Calor", "Aires Acondicionados", "Split Frío/Calor", 410000, 579000, 10, 7, 4],
  ["AIR-002", "Aire Split 3000 Frigorías Frío/Calor", "Aires Acondicionados", "Split Frío/Calor", 480000, 679000, 8, 5, 4],
  ["AIR-003", "Aire Split 5500 Frigorías Inverter", "Aires Acondicionados", "Split Frío/Calor", 820000, 1149000, 3, 2, 2],
  ["AIR-004", "Aire Split 2600 Frigorías Solo Frío", "Aires Acondicionados", "Split Frío", 360000, 499000, 9, 4, 3],
  ["COC-001", "Cocina a Gas 4 Hornallas Inox", "Cocinas", "A Gas", 310000, 439000, 7, 3, 3],
  ["COC-002", "Cocina a Gas 5 Hornallas con Grill", "Cocinas", "A Gas", 420000, 589000, 4, 2, 2],
  ["COC-003", "Anafe Eléctrico 4 Zonas", "Cocinas", "A Gas", 150000, 209000, 6, 4, 2],
  ["PEQ-001", "Microondas 20L Digital", "Pequeños Electrodomésticos", "Cocción", 75000, 109000, 18, 10, 6],
  ["PEQ-002", "Freidora de Aire 5L", "Pequeños Electrodomésticos", "Cocción", 98000, 139000, 14, 9, 5],
  ["PEQ-003", "Pava Eléctrica 1.7L Inox", "Pequeños Electrodomésticos", "Cocción", 21000, 32900, 25, 14, 8],
  ["PEQ-004", "Licuadora 600W Vaso Vidrio", "Pequeños Electrodomésticos", "Cocción", 34000, 49900, 3, 5, 6],
  ["PEQ-005", "Aspiradora Ciclónica 1600W", "Pequeños Electrodomésticos", "Limpieza", 62000, 89900, 9, 6, 4],
  ["PEQ-006", "Robot Aspirador Inteligente", "Pequeños Electrodomésticos", "Limpieza", 185000, 259000, 5, 2, 2],
  ["PEQ-007", "Tostadora 2 Rebanadas", "Pequeños Electrodomésticos", "Cocción", 17000, 25900, 0, 0, 5],
  ["PEQ-008", "Batidora de Mano 300W", "Pequeños Electrodomésticos", "Cocción", 26000, 38500, 11, 7, 4],
];

const productos: ProductoDb[] = PRODUCTOS_SEED.map(
  ([code, name, category, subcategory, cost, price, sc, sn, minStock], i) => ({
    id: `prod-${String(i + 1).padStart(3, "0")}`,
    code,
    name,
    category,
    subcategory,
    price,
    cost,
    stock: { [SUC_CENTRAL]: sc, [SUC_NORTE]: sn },
    minStock,
    description: "",
    imageUrl: "",
    barcode: `779${String(1000000000 + i * 7919).slice(0, 10)}`,
    discountActive: false,
    discountPercent: 0,
    activo: true,
  }),
);
// Un par de productos con descuento activo para la sección Ofertas.
productos[6].discountActive = true;
productos[6].discountPercent = 10;
productos[17].discountActive = true;
productos[17].discountPercent = 15;

const clientes: ClienteDb[] = [
  { id: 1, nombre: "Marcela Giménez", telefono: "261 555-1001", cuit: "27-24123456-4", email: "marcela.gimenez@example.com", direccion: "Belgrano 456, Godoy Cruz", saldoPendiente: 0 },
  { id: 2, nombre: "Carlos Funes", telefono: "261 555-1002", cuit: "20-28765432-1", email: "cfunes@example.com", direccion: "Mitre 120, Mendoza", saldoPendiente: 0 },
  { id: 3, nombre: "Hotel Andes Plaza S.A.", telefono: "261 555-1003", cuit: "30-71234567-8", email: "compras@andesplaza.example.com", direccion: "Av. Libertador 900, Mendoza", saldoPendiente: 0 },
  { id: 4, nombre: "Lucía Herrera", telefono: "261 555-1004", cuit: "27-31222333-5", email: "lucia.herrera@example.com", direccion: "Los Olivos 85, Luján de Cuyo", saldoPendiente: 0 },
  { id: 5, nombre: "Ferretería El Tornillo", telefono: "261 555-1005", cuit: "30-70998877-2", email: "info@eltornillo.example.com", direccion: "Ruta 7 Km 1050, Maipú", saldoPendiente: 0 },
  { id: 6, nombre: "Ricardo Sosa", telefono: "261 555-1006", cuit: "20-22334455-9", direccion: "Sarmiento 2210, Guaymallén", saldoPendiente: 0 },
  { id: 7, nombre: "Valeria Paz", telefono: "261 555-1007", cuit: "27-33445566-7", email: "vpaz@example.com", direccion: "Alem 330, Las Heras", saldoPendiente: 0 },
  { id: 8, nombre: "Consorcio Torre Sol", telefono: "261 555-1008", cuit: "30-65432109-3", direccion: "9 de Julio 1500, Mendoza", saldoPendiente: 0 },
];

const proveedores: ProveedorDb[] = [
  { id: "prov-1", nombre: "Distribuidora Cuyo Electro", telefono: "261 555-2001", cuit: "30-70111222-3", email: "ventas@cuyoelectro.example.com", direccion: "Parque Industrial, Mendoza", saldoPendiente: 0, activo: true },
  { id: "prov-2", nombre: "Frigoríficos del Oeste S.R.L.", telefono: "11 5555-2002", cuit: "30-70333444-5", email: "pedidos@frigooeste.example.com", direccion: "Av. Industrial 4500, Buenos Aires", saldoPendiente: 0, activo: true },
  { id: "prov-3", nombre: "TecnoImport Argentina", telefono: "11 5555-2003", cuit: "30-70555666-7", email: "comercial@tecnoimport.example.com", direccion: "Puerto Madero, Buenos Aires", saldoPendiente: 0, activo: true },
  { id: "prov-4", nombre: "Hogar Mayorista", telefono: "351 555-2004", cuit: "30-70777888-9", direccion: "Córdoba Capital", saldoPendiente: 0, activo: true },
];

// ---------------------------------------------------------------------------
// Estado mutable
// ---------------------------------------------------------------------------

export const DB = {
  sucursales,
  usuarios,
  categorias,
  subcategorias,
  productos,
  clientes,
  ventasFiado: [] as VentaFiadoDb[],
  pagos: [] as PagoDb[],
  proveedores,
  comprasProveedor: [] as CompraProveedorDb[],
  pagosProveedor: [] as PagoProveedorDb[],
  movimientos: [] as MovimientoDb[],
};

// ---------------------------------------------------------------------------
// Sesión / sucursal activa
// ---------------------------------------------------------------------------

const SESSION_KEY = "invex.mock.session";

export function readSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeSessionUserId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // sin storage: la sesión dura hasta recargar
  }
}

export function currentUser(): UsuarioDb | null {
  const id = readSessionUserId();
  return DB.usuarios.find((u) => u.id === id) ?? null;
}

/** Sucursal en la que se opera ahora: la elegida, la del usuario o la principal. */
export function sucursalActualId(): string {
  const elegida = useSucursalStore.getState().sucursalOperacionId;
  if (elegida && DB.sucursales.some((s) => s.id === elegida)) return elegida;
  const propia = currentUser()?.sucursal_id;
  if (propia) return propia;
  return (DB.sucursales.find((s) => s.es_principal) ?? DB.sucursales[0]).id;
}

export function stockEn(p: ProductoDb, sucursalId: string): number {
  return p.stock[sucursalId] ?? 0;
}

export function stockTotal(p: ProductoDb): number {
  return Object.values(p.stock).reduce((a, b) => a + b, 0);
}

// ---------------------------------------------------------------------------
// Historial de ventas semilla (últimos ~45 días)
// ---------------------------------------------------------------------------

const METODOS = ["debito", "debito", "credito", "tarjeta", "credito"] as const;
const FACTOR: Record<string, number> = { debito: 0.9, credito: 1, tarjeta: 1.25 };
const VENDEDORES = [
  { id: "usr-vendedor1", nombre: "vendedor1" },
  { id: "usr-caja1", nombre: "caja1" },
];

function sembrarVentas() {
  let ventaN = 0;
  for (let dia = 45; dia >= 0; dia--) {
    const ventasDelDia = dia === 0 ? 3 : Math.floor(rnd() * 3) + (dia % 7 === 0 ? 0 : 1);
    for (let v = 0; v < ventasDelDia; v++) {
      ventaN += 1;
      const ventaId = `venta-seed-${ventaN}`;
      const metodo = pick([...METODOS]);
      const vendedor = pick(VENDEDORES);
      const cliente = rnd() < 0.4 ? pick(DB.clientes) : null;
      const sucursalId = rnd() < 0.7 ? SUC_CENTRAL : SUC_NORTE;
      const renglones = 1 + Math.floor(rnd() * 2);
      const fecha = haceDias(dia, 9 + Math.floor(rnd() * 9), Math.floor(rnd() * 60));
      for (let r = 0; r < renglones; r++) {
        const prod = pick(DB.productos);
        const cantidad = 1 + Math.floor(rnd() * 2);
        const precio = Math.round(prod.price * (FACTOR[metodo] ?? 1));
        const stockDespues = stockEn(prod, sucursalId);
        DB.movimientos.push({
          id: `mov-seed-${ventaN}-${r}`,
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          type: "salida",
          esTransferencia: false,
          quantity: cantidad,
          reason: "Venta",
          date: fecha,
          previousQuantity: stockDespues + cantidad,
          newQuantity: stockDespues,
          valor_total: precio * cantidad,
          metodoPago: metodo,
          usuarioId: vendedor.id,
          usuarioNombre: vendedor.nombre,
          sucursalId,
          clienteId: cliente?.id ?? null,
          ventaId,
        });
      }
    }
  }
  // Una entrada de mercadería de referencia.
  const p = DB.productos[0];
  DB.movimientos.push({
    id: "mov-seed-entrada-1",
    productId: p.id,
    productName: p.name,
    productCode: p.code,
    type: "entrada",
    esTransferencia: false,
    quantity: 6,
    reason: "Ingreso de mercadería",
    date: haceDias(20, 10),
    previousQuantity: 2,
    newQuantity: 8,
    valor_total: p.cost * 6,
    metodoPago: null,
    usuarioId: "usr-caja1",
    usuarioNombre: "caja1",
    sucursalId: SUC_CENTRAL,
    clienteId: null,
    ventaId: null,
  });
  DB.movimientos.sort((a, b) => b.date.localeCompare(a.date));
}

function sembrarCuentasCorrientes() {
  // Ventas fiadas y pagos para los clientes 2, 3, 5 y 8.
  let detalleId = 1;
  const crear = (id: number, clienteId: number, dias: number, items: Array<[number, number]>, pagado: number) => {
    const detalles: VentaFiadoDetalleDb[] = items.map(([idx, cantidad]) => {
      const prod = DB.productos[idx];
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
    const fecha = haceDias(dias, 11);
    DB.ventasFiado.push({
      id,
      clienteId,
      fecha: soloFecha(fecha),
      total,
      saldoPendiente: total - pagado,
      detalles,
      createdAt: fecha,
    });
    if (pagado > 0) {
      DB.pagos.push({ id: DB.pagos.length + 1, cliente_id: clienteId, venta_fiado_id: id, monto: pagado, fecha: haceDias(Math.max(dias - 10, 1), 15) });
    }
    const cliente = DB.clientes.find((c) => c.id === clienteId)!;
    cliente.saldoPendiente += total - pagado;
  };
  crear(1, 2, 70, [[14, 1]], 100000);
  crear(2, 3, 40, [[10, 2], [12, 1]], 0);
  crear(3, 5, 95, [[16, 2]], 0);
  crear(4, 8, 12, [[0, 1]], 300000);
}

function sembrarComprasProveedor() {
  const crear = (id: string, proveedorId: string, dias: number, items: Array<[number, number]>, pagado: number) => {
    const detalles = items.map(([idx, cantidad]) => {
      const prod = DB.productos[idx];
      return { productoId: prod.id, nombre: prod.name, cantidad, precioUnitario: prod.cost };
    });
    const total = detalles.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);
    const fecha = haceDias(dias, 10);
    DB.comprasProveedor.push({
      id,
      proveedorId,
      fecha: soloFecha(fecha),
      total,
      saldoPendiente: total - pagado,
      concepto: "Reposición de stock",
      detalles,
      createdAt: fecha,
    });
    if (pagado > 0) {
      DB.pagosProveedor.push({ id: `pp-${id}`, proveedorId, compraId: id, monto: pagado, fecha: haceDias(Math.max(dias - 5, 1), 14), concepto: "Pago parcial" });
    }
    DB.proveedores.find((p) => p.id === proveedorId)!.saldoPendiente += total - pagado;
  };
  crear("compra-1", "prov-1", 30, [[0, 4], [1, 6]], 2000000);
  crear("compra-2", "prov-3", 18, [[6, 10], [7, 6]], 0);
  crear("compra-3", "prov-2", 55, [[3, 5]], 3050000);
}

sembrarVentas();
sembrarCuentasCorrientes();
sembrarComprasProveedor();
