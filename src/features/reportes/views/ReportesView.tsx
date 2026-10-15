

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { StockValueReport } from "@/features/reportes/components/stock-value-report";
import { DeudaProveedoresChart } from "@/features/reportes/components/deuda-proveedores-chart";
import { SucursalesComparativo } from "@/features/reportes/components/sucursales-comparativo";
import { ClientesReporte } from "@/features/reportes/components/clientes-reporte";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { useProveedores } from "@/features/proveedores/hooks/use-proveedores";

export default function ReportesView() {
  const { products } = useProducts();
  const { resumenInventario } = useMovements();
  const { deudaProveedores } = useProveedores();

  const totalValue = useMemo(
    () => products.reduce((s, p) => s + p.price * p.quantity, 0),
    [products]
  );
  const totalCost = useMemo(
    () => products.reduce((s, p) => s + p.cost * p.quantity, 0),
    [products]
  );

  const finalValue = resumenInventario?.valor_total_venta ?? totalValue;
  const finalCost = resumenInventario?.valor_total_stock ?? totalCost;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold">Reportes y análisis</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Valor, costos y márgenes de tu inventario
        </p>
      </div>

      <SucursalesComparativo />

      <ClientesReporte />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <StockValueReport
          products={products}
          totalInventoryValue={finalValue}
          totalInventoryCost={finalCost}
        />
        <DeudaProveedoresChart deuda={deudaProveedores} />
      </div>
    </div>
  );
}
