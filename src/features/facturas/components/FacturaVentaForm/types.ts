import type { Product } from "@/shared/types/inventory";

export interface FacturaVentaItem {
  id: string;
  producto: Product;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DatosCliente {
  nombre: string;
  cuit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface FacturaVenta {
  id: string;
  numero: string;
  fecha: string;
  cliente: DatosCliente;
  items: FacturaVentaItem[];
  subtotal: number;
  iva: number;
  total: number;
  observaciones: string;
}

export interface NuevoItemState {
  cantidad: string;
  precioUnitario: string;
}
