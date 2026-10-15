

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, History, TrendingDown, TrendingUp } from "lucide-react";
import type { Movement, Product } from "@/shared/types/inventory";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString("es-AR")}`;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Hoy";
    if (d.toDateString() === yesterday.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function DashboardHomeSection({
  isMobile,
  movements,
  products,
  lowStockAlertsCount,
  totalValue,
  totalCost,
  onNavigateMovements,
  onNavigateReports,
}: {
  isMobile: boolean;
  movements: Movement[];
  products: Product[];
  lowStockAlertsCount: number;
  totalValue: number;
  totalCost: number;
  onNavigateMovements: () => void;
  onNavigateReports: () => void;
}) {
  const sorted = [...movements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const margin = totalValue - totalCost;
  const marginPct = totalCost > 0 ? ((margin / totalCost) * 100).toFixed(1) : "—";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
      {/* Movimientos recientes */}
      <Card className="xl:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Últimos movimientos</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={onNavigateMovements}
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <History className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Sin movimientos registrados</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Los movimientos aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sorted.map((m) => {
                const productName =
                  (m.productId && products.find((p) => p.id === m.productId)?.name) ||
                  m.productName ||
                  "Movimiento";
                const isSale = m.type === "entrada";
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors"
                  >
                    <div className={[
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                      isSale ? "bg-emerald-100 dark:bg-emerald-950/50" : "bg-blue-100 dark:bg-blue-950/50",
                    ].join(" ")}>
                      {isSale
                        ? <TrendingDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        : <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-none">{productName}</p>
                      {m.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.reason}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={[
                        "text-sm font-semibold",
                        isSale ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400",
                      ].join(" ")}>
                        {isSale ? "−" : "+"}{m.quantity}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(m.date)} · {formatTime(m.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen financiero */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Resumen</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={onNavigateReports}
            >
              Reportes
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Valor */}
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Valor inventario</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalValue)}
            </p>
          </div>

          {/* Costo */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Costo total</span>
              <span className="font-medium">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Margen bruto</span>
              <span className={`font-semibold ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {formatCurrency(margin)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">% Margen</span>
              <Badge variant={margin >= 0 ? "secondary" : "destructive"} className="text-xs">
                {marginPct}%
              </Badge>
            </div>
          </div>

          {/* Alertas */}
          {lowStockAlertsCount > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Alertas activas</span>
                <Badge variant="destructive" className="text-xs">
                  {lowStockAlertsCount}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
