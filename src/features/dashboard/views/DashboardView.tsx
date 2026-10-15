import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { useCurrentUser } from "@/features/auth/context/auth-context";
import { DashboardHomeSection } from "@/features/dashboard/components/layout/DashboardHomeSection";
import { DashboardMetrics } from "@/features/dashboard/components/layout/DashboardMetrics";

export default function DashboardView() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (user?.rol === "vendedor") {
      navigate("/facturas/venta", { replace: true });
    }
  }, [user?.rol, navigate]);

  const { products } = useProducts();
  const { movements, stockBajo, resumenInventario } = useMovements();

  const totalValue = useMemo(
    () => products.reduce((s, p) => s + p.price * p.quantity, 0),
    [products]
  );
  const totalCost = useMemo(
    () => products.reduce((s, p) => s + p.cost * p.quantity, 0),
    [products]
  );

  const lowStockCount = stockBajo.length;

  const productsCount =
    typeof resumenInventario?.total_productos === "number"
      ? resumenInventario.total_productos
      : products.length;
  // valor_total_stock = a costo (legacy); valor_total_venta = a precio de venta (nuevo)
  const inventoryCost =
    typeof resumenInventario?.valor_total_stock === "number"
      ? resumenInventario.valor_total_stock
      : totalCost;
  const inventoryValue =
    typeof resumenInventario?.valor_total_venta === "number"
      ? resumenInventario.valor_total_venta
      : totalValue;
  const movementsMonth =
    typeof resumenInventario?.total_movimientos_mes === "number"
      ? resumenInventario.total_movimientos_mes
      : movements.length;
  const lowStockMetrics =
    typeof resumenInventario?.productos_bajo_stock === "number"
      ? resumenInventario.productos_bajo_stock
      : lowStockCount;

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Encabezado de sección */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Dashboard</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Resumen general del inventario
        </p>
      </div>

      {/* Métricas — siempre visibles */}
      <DashboardMetrics
        productsCount={productsCount}
        totalInventoryValue={inventoryValue}
        totalInventoryCost={inventoryCost}
        movementsCount={movementsMonth}
        lowStockAlertsCount={lowStockMetrics}
        connectionStatus="connected"
        onNavigateMovements={() => navigate("/movimientos")}
        onNavigateAlerts={() => navigate("/alertas")}
      />

      {/* Cuerpo principal */}
      <DashboardHomeSection
        isMobile={isMobile}
        movements={movements}
        products={products}
        lowStockAlertsCount={lowStockCount}
        totalValue={inventoryValue}
        totalCost={inventoryCost}
        onNavigateMovements={() => navigate("/movimientos")}
        onNavigateReports={() => navigate("/reportes")}
      />
    </div>
  );
}
