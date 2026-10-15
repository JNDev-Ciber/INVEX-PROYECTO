

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { VentaFiado } from "@/shared/types/inventory";
import { formatFechaLocal } from "@/shared/lib/date";

interface VentasAPagarListProps {
  ventasAb: VentaFiado[];
  pagoState: { [detalleId: number]: boolean };
  setPagoState: React.Dispatch<
    React.SetStateAction<{ [detalleId: number]: boolean }>
  >;
  isLoading: boolean;
  onMarcarPagados: (detalleIds: number[], ventaId: number) => void;
}

export function VentasAPagarList({
  ventasAb,
  pagoState,
  setPagoState,
  isLoading,
  onMarcarPagados,
}: VentasAPagarListProps) {
  return (
    <div className="space-y-3">
      {ventasAb.length > 0 ? (
        ventasAb.map((venta) => (
          <Card
            key={venta.id}
            className="p-4 border-l-4 border-l-red-500"
          >
            <div className="flex justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {formatFechaLocal(venta.fecha)}
                </p>
                <p className="text-xl font-bold text-red-600">
                  ${venta.saldoPendiente.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {venta.detalles?.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                    pagoState[d.id]
                      ? "bg-green-100 border-2 border-green-400"
                      : d.pagado
                      ? "bg-gray-100 opacity-50"
                      : "hover:bg-blue-50 dark:hover:bg-blue-950/30 border-2 border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => {
                    if (d.pagado) return;
                    setPagoState((p) => ({
                      ...p,
                      [d.id]: !p[d.id],
                    }));
                  }}
                >
                  {!d.pagado && (
                    <input
                      type="checkbox"
                      checked={pagoState[d.id] || false}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                  )}
                  {d.pagado && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {d.productoNombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.cantidad} × $
                      {d.precioUnitario.toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-sm">
                    ${d.subtotal.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            {venta.detalles?.some((d) => pagoState[d.id]) && (
              <Button
                onClick={async () => {
                  const detallesSeleccionados =
                    venta.detalles
                      ?.filter((d) => pagoState[d.id])
                      .map((d) => d.id) || [];
                  try {
                    await onMarcarPagados(detallesSeleccionados, venta.id);
                    setPagoState((p) => {
                      const next = { ...p };
                      detallesSeleccionados.forEach((id) => delete next[id]);
                      return next;
                    });
                  } catch {
                    // el error ya se muestra en un toast desde el handler padre
                  }
                }}
                disabled={isLoading}
                className="w-full mt-3"
              >
                Marcar Pagados
              </Button>
            )}
          </Card>
        ))
      ) : (
        <p className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Check className="h-4 w-4" />
          Sin deudas pendientes
        </p>
      )}
    </div>
  );
}
