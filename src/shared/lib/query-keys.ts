export const queryKeys = {
  products: {
    all: ["products"] as const,
    page: (limit: number, offset: number) =>
      ["products", "page", { limit, offset }] as const,
    list: (limit: number) => ["products", "list", { limit }] as const,
  },
  resumen: ["resumen-inventario"] as const,
  movements: ["movements"] as const,
  stockBajo: ["stock-bajo"] as const,
  clientes: ["clientes"] as const,
  ventasFiado: ["ventas-fiado"] as const,
  pagos: ["pagos"] as const,
  categorias: ["categorias"] as const,
  subcategorias: (categoriaId: string | number) =>
    ["subcategorias", categoriaId] as const,
  empleados: ["empleados"] as const,
  jornadas: (empleadoId: string, fechaInicio: string, fechaFin: string) =>
    ["jornadas", empleadoId, fechaInicio, fechaFin] as const,
  semanasPago: (empleadoId: string) => ["semanas-pago", empleadoId] as const,
  proveedores: ["proveedores"] as const,
  comprasProveedor: (proveedorId: string) =>
    ["compras-proveedor", proveedorId] as const,
  pagosProveedor: (proveedorId: string) =>
    ["pagos-proveedor", proveedorId] as const,
  deudaProveedores: ["deuda-proveedores"] as const,
  ventasPorEmpleado: (fechaInicio: string, fechaFin: string) =>
    ["ventas-por-empleado", fechaInicio, fechaFin] as const,
  pedidosWebPendientes: ["pedidos-web", "pendientes"] as const,
  historialPedidosWeb: ["pedidos-web", "historial"] as const,
  sucursales: ["sucursales"] as const,
  miSucursal: ["sucursales", "mia"] as const,
  remitos: ["remitos"] as const,
  remitoItems: (remitoId: string) => ["remitos", "items", remitoId] as const,
  resumenSucursales: (dias: number) => ["reportes", "sucursales", dias] as const,
  crm: {
    all: ["crm"] as const,
    clientes: ["crm", "clientes"] as const,
    detalle: (clienteId: number) => ["crm", "detalle", clienteId] as const,
    agenda: (dias: number) => ["crm", "agenda", dias] as const,
    inteligencia: ["crm", "inteligencia"] as const,
  },
};
