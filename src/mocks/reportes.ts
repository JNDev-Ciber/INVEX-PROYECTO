import { DB, SUC_NORTE, delay, stockEn } from "./db";

export interface ResumenSucursal {
  sucursal_id: string;
  nombre: string;
  es_principal: boolean;
  ventas: number;
  unidades_vendidas: number;
  ingresos: number;
  unidades_stock: number;
  valor_stock_costo: number;
  valor_stock_venta: number;
  productos_bajo_minimo: number;
  productos_sin_stock: number;
  remitos_por_recibir: number;
  unidades_en_camino: number;
}

/** Comparativo de sucursales. */
export async function getResumenPorSucursal(dias: number): Promise<ResumenSucursal[]> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);
  const desdeMs = desde.getTime();

  const filas = DB.sucursales.map((s): ResumenSucursal => {
    const movs = DB.movimientos.filter(
      (m) =>
        m.sucursalId === s.id &&
        m.type === "salida" &&
        !m.esTransferencia &&
        new Date(m.date).getTime() >= desdeMs,
    );
    const ventasIds = new Set(movs.map((m) => m.ventaId ?? m.id));

    let unidadesStock = 0;
    let valorCosto = 0;
    let valorVenta = 0;
    let bajoMinimo = 0;
    let sinStock = 0;
    for (const p of DB.productos) {
      if (!p.activo) continue;
      const q = stockEn(p, s.id);
      unidadesStock += q;
      valorCosto += p.cost * q;
      valorVenta += p.price * q;
      if (q <= 0) sinStock += 1;
      else if (q < p.minStock) bajoMinimo += 1;
    }

    const esNorte = s.id === SUC_NORTE;
    return {
      sucursal_id: s.id,
      nombre: s.nombre,
      es_principal: s.es_principal,
      ventas: ventasIds.size,
      unidades_vendidas: movs.reduce((a, m) => a + m.quantity, 0),
      ingresos: movs.reduce((a, m) => a + m.valor_total, 0),
      unidades_stock: unidadesStock,
      valor_stock_costo: valorCosto,
      valor_stock_venta: valorVenta,
      productos_bajo_minimo: bajoMinimo,
      productos_sin_stock: sinStock,
      remitos_por_recibir: esNorte ? 1 : 0,
      unidades_en_camino: esNorte ? 3 : 0,
    };
  });

  return delay(filas);
}
