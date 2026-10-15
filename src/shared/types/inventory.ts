export interface Product {
  id: string
  code: string
  name: string
  category: string
  subcategory?: string   
  price: number
  originalPrice?: number
  cost: number
  /** Stock en la sucursal activa */
  quantity: number
  /** Stock sumando todas las sucursales (si la consulta lo trae) */
  totalQuantity?: number
  minStock: number
  description: string
  imageUrl?: string
  discountActive?: boolean
  discountPercent?: number
  createdAt: string
  updatedAt: string
  barcode?: string 
}


export type MetodoPago =
  | "debito"
  | "credito"
  | "tarjeta"
  | "cuenta_corriente";

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  debito: "Debito/Efectivo",
  credito: "Precio de Lista",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta Corriente",
};

/**
 * Ajuste sobre el precio de lista segun como paga el cliente.
 * El precio de lista es la base: "credito" es el factor neutro 1.
 *
 * Ojo con el nombre "credito": historicamente fue (y sigue siendo) la venta
 * a precio de lista sin recargo, por eso su factor es 1. El pago con tarjeta
 * con recargo es "tarjeta", un metodo aparte, para no mezclar las ventas
 * viejas con las nuevas en Cerrar Caja ni en los reportes.
 */
export const FACTOR_METODO_PAGO: Record<MetodoPago, number> = {
  debito: 0.9,
  credito: 1,
  tarjeta: 1.25,
  cuenta_corriente: 1,
};

/** Metodos que mueven plata el mismo dia (entran al total de Cerrar Caja). */
export const METODOS_COBRO_INMEDIATO: MetodoPago[] = [
  "debito",
  "credito",
  "tarjeta",
];

export interface VentaPorEmpleadoProducto {
  productoId: string | null;
  productoNombre: string;
  cantidad: number;
  total: number;
}

export interface VentaPorEmpleado {
  usuarioId: string;
  empleadoId: string | null;
  nombreMostrado: string;
  totalVendido: number;
  cantidadUnidades: number;
  cantidadVentas: number;
  porMetodoPago: Record<string, number>;
  porProducto: VentaPorEmpleadoProducto[];
}

export interface Movement {
  id: string
  productId: string | null; 
  productName?: string;
  productCode?: string;
  type: "entrada" | "salida"
  /** Movimiento de un remito entre sucursales (no mueve plata) */
  esTransferencia?: boolean
  quantity: number
  reason: string
  date: string
  previousQuantity: number
  newQuantity: number
  valor_total?: number;
  /** Método de pago de la venta (lo usa el Cierre de Caja). */
  metodoPago?: string | null;
}

export interface VentaFiadoDetalle {
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
export interface Pago {
  id: number;
  cliente_id: number;
  venta_fiado_id: number | null;
  monto: number;
  fecha: string;
}

export interface VentaFiado {
  id: number;
  clienteId: number;
  fecha: string;
  total: number;
  saldoPendiente: number;
  detalles?: VentaFiadoDetalle[];
  createdAt: string;
}

export interface ClienteVenta {
  id: number;
  nombre: string;
  telefono?: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  saldoPendiente: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  telefono?: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  saldoPendiente: number;
  activo: boolean;
}

export interface CompraProveedorDetalle {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CompraProveedor {
  id: string;
  proveedorId: string;
  fecha: string;
  total: number;
  saldoPendiente: number;
  concepto?: string;
  detalles?: CompraProveedorDetalle[] | null;
  createdAt: string;
}

export interface PagoProveedor {
  id: string;
  proveedorId: string;
  compraId?: string | null;
  monto: number;
  fecha: string;
  concepto?: string;
}

export interface DeudaProveedor {
  proveedorId: string;
  nombre: string;
  saldoPendiente: number;
}


export interface PriceHistory {
  id: string
  productId: string
  previousPrice: number
  newPrice: number
  date: string
  reason: string
}

export interface StockAlert {
  product: Product
  currentStock: number
  minStock: number
  difference: number
}
