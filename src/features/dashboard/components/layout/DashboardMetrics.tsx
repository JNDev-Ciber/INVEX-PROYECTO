

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";

type ConnectionStatus = "connecting" | "connected" | "error" | "offline";

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString("es-AR")}`;
}

export function DashboardMetrics({
  productsCount,
  totalInventoryValue,
  totalInventoryCost,
  movementsCount,
  lowStockAlertsCount,
  connectionStatus,
  onNavigateMovements,
  onNavigateAlerts,
}: {
  productsCount: number;
  totalInventoryValue: number;
  totalInventoryCost: number;
  movementsCount: number;
  lowStockAlertsCount: number;
  connectionStatus: ConnectionStatus;
  onNavigateMovements: () => void;
  onNavigateAlerts: () => void;
}) {
  const metrics = [
    {
      label: "Productos",
      value: productsCount,
      display: productsCount.toLocaleString("es-AR"),
      sub: connectionStatus === "offline" ? "Datos de ejemplo" : "en inventario",
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: undefined,
    },
    {
      label: "Valor venta",
      value: totalInventoryValue,
      display: formatCompact(totalInventoryValue),
      sub: "precio de venta",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      onClick: undefined,
    },
    {
      label: "Valor costo",
      value: totalInventoryCost,
      display: formatCompact(totalInventoryCost),
      sub: "costo unitario",
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      onClick: undefined,
    },
    {
      label: "Movimientos",
      value: movementsCount,
      display: movementsCount.toLocaleString("es-AR"),
      sub: "este mes",
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      onClick: onNavigateMovements,
    },
    {
      label: "Alertas stock",
      value: lowStockAlertsCount,
      display: lowStockAlertsCount.toLocaleString("es-AR"),
      sub: lowStockAlertsCount > 0 ? "bajo mínimo" : "todo en stock",
      icon: AlertTriangle,
      color: lowStockAlertsCount > 0
        ? "text-destructive"
        : "text-muted-foreground",
      bg: lowStockAlertsCount > 0
        ? "bg-destructive/10"
        : "bg-muted",
      onClick: onNavigateAlerts,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        const isClickable = Boolean(m.onClick);
        return (
          <Card
            key={m.label}
            onClick={m.onClick}
            className={[
              "transition-shadow",
              isClickable ? "cursor-pointer hover:shadow-md" : "",
            ].join(" ")}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {m.label}
                  </p>
                  <p className={`text-2xl md:text-3xl font-bold mt-1 ${m.color}`}>
                    {m.display}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {m.sub}
                  </p>
                </div>
                <div className={`rounded-lg p-2 shrink-0 ${m.bg}`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${m.color} ${m.value === lowStockAlertsCount && lowStockAlertsCount > 0 ? "animate-pulse" : ""}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
