import type { Product } from "@/shared/types/inventory"

export interface FacturaCompraItem {
  id: string
  producto: Product
  cantidad: number
  costoUnitario: number
  precioVentaUnitario: number
  subtotal: number
}

export interface DatosProveedor {
  nombre: string
  cuit: string
  direccion?: string
  telefono?: string
  email?: string
}

export interface FacturaCompra {
  id: string
  numero: string
  fecha: string
  proveedor: DatosProveedor
  items: FacturaCompraItem[]
  subtotal: number
  iva: number
  total: number
  observaciones: string
}

export interface NuevoItemState {
  cantidad: string
  costoUnitario: string
  precioVentaUnitario: string
}
