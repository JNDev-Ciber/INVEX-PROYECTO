import { useState } from "react";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumenPorSucursal } from "@/features/reportes/hooks/use-resumen-sucursales";
import { CardColapsable } from "@/features/reportes/components/CardColapsable";

const PERIODOS = [7, 30, 90] as const;

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
const numero = (n: number) => n.toLocaleString("es-AR");

export function SucursalesComparativo() {
  const [dias, setDias] = useState<number>(30);
  const { data: filas = [], isLoading, error } = useResumenPorSucursal(dias);

  // Con una sola sucursal el comparativo no aporta: se oculta.
  if (!isLoading && !error && filas.length <= 1) return null;

  const totalIngresos = filas.reduce((s, f) => s + f.ingresos, 0);

  return (
    <CardColapsable
      titulo="Comparativo por sucursal"
      icono={<Store className="h-4 w-4 text-primary" />}
      acciones={
        <div className="flex gap-1" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={dias === p ? "default" : "outline"}
              className="h-7 px-2.5 text-xs"
              aria-pressed={dias === p}
              onClick={() => setDias(p)}
            >
              {p} días
            </Button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No se pudo cargar el comparativo: {error instanceof Error ? error.message : "error desconocido"}
        </p>
      ) : filas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No hay sucursales activas.</p>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left font-medium py-2 pr-3">Sucursal</th>
                <th className="text-right font-medium py-2 px-3">Ventas</th>
                <th className="text-right font-medium py-2 px-3">Ingresos</th>
                <th className="text-right font-medium py-2 px-3">Stock (u.)</th>
                <th className="text-right font-medium py-2 px-3">Stock a costo</th>
                <th className="text-right font-medium py-2 px-3">Stock a venta</th>
                <th className="text-right font-medium py-2 px-3">Bajo mínimo</th>
                <th className="text-right font-medium py-2 px-3">Sin stock</th>
                <th className="text-right font-medium py-2 pl-3">Por recibir</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const participacion = totalIngresos > 0 ? Math.round((f.ingresos / totalIngresos) * 100) : 0;
                return (
                  <tr key={f.sucursal_id} className="border-b last:border-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium">{f.nombre}</p>
                      {f.es_principal && <p className="text-[11px] text-muted-foreground">Principal</p>}
                    </td>
                    <td className="text-right py-2.5 px-3 tabular-nums">
                      {numero(f.ventas)}
                      <p className="text-[11px] text-muted-foreground">{numero(f.unidades_vendidas)} u.</p>
                    </td>
                    <td className="text-right py-2.5 px-3 tabular-nums">
                      {pesos(f.ingresos)}
                      <p className="text-[11px] text-muted-foreground">{participacion}% del total</p>
                    </td>
                    <td className="text-right py-2.5 px-3 tabular-nums">{numero(f.unidades_stock)}</td>
                    <td className="text-right py-2.5 px-3 tabular-nums">{pesos(f.valor_stock_costo)}</td>
                    <td className="text-right py-2.5 px-3 tabular-nums">{pesos(f.valor_stock_venta)}</td>
                    <td
                      className={cn(
                        "text-right py-2.5 px-3 tabular-nums",
                        f.productos_bajo_minimo > 0 && "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {numero(f.productos_bajo_minimo)}
                    </td>
                    <td
                      className={cn(
                        "text-right py-2.5 px-3 tabular-nums",
                        f.productos_sin_stock > 0 && "text-red-600 dark:text-red-400"
                      )}
                    >
                      {numero(f.productos_sin_stock)}
                    </td>
                    <td className="text-right py-2.5 pl-3 tabular-nums">
                      {f.remitos_por_recibir > 0 ? (
                        <>
                          {numero(f.remitos_por_recibir)} {f.remitos_por_recibir === 1 ? "remito" : "remitos"}
                          <p className="text-[11px] text-muted-foreground">{numero(f.unidades_en_camino)} u.</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Ventas de los últimos {dias} días. Sin stock: productos que la sucursal ya manejó y hoy tiene en 0.
      </p>
    </CardColapsable>
  );
}
