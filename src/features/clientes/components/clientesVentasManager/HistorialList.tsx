

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Check } from "lucide-react";
import type { ClienteVenta, Pago, VentaFiado } from "@/shared/types/inventory";
import { formatFechaLocal } from "@/shared/lib/date";

interface HistorialListProps {
  selectedCliente: ClienteVenta;
  todasVentas: VentaFiado[];
  pagos: Pago[];
  isLoading: boolean;
}

export function HistorialList({
  selectedCliente,
  todasVentas,
  pagos,
  isLoading,
}: HistorialListProps) {
  return (
    <div className="space-y-3">
      {(() => {
        const clientePagos = pagos.filter(
          (p) => p.cliente_id === selectedCliente.id
        );

        const historialCombinado = [
          ...todasVentas.map((v) => ({
            tipo: "venta",
            data: v,
            fecha: new Date(v.fecha),
          })),
          ...clientePagos.map((p) => ({
            tipo: "pago",
            data: p,
            fecha: new Date(p.fecha),
          })),
        ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        return historialCombinado.length > 0 ? (
          historialCombinado.map((item, index) => {
            if (item.tipo === "pago") {
              const pago = item.data as Pago;
              return (
                <Card
                  key={`pago-${pago.id}`}
                  className="p-4 border-l-4 border-l-primary"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {formatFechaLocal(pago.fecha)}
                      </p>
                      <p className="text-[hsl(var(--income))] font-bold flex items-center gap-2 tabular-nums">
                        <DollarSign className="h-4 w-4" />
                        Pago parcial: ${pago.monto.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-[hsl(var(--income))]/10 text-[hsl(var(--income))] border-[hsl(var(--income))]/30 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Pago
                    </Badge>
                  </div>
                </Card>
              );
            } else {
              const venta = item.data as VentaFiado;
              return (
                <Card
                  key={`venta-${venta.id}`}
                  className={`p-4 border-l-4 ${
                    venta.saldoPendiente > 0
                      ? "border-l-[hsl(var(--expense))]"
                      : "border-l-[hsl(var(--income))]"
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {formatFechaLocal(venta.fecha)}
                      </p>
                      {venta.saldoPendiente > 0 ? (
                        <p className="text-[hsl(var(--expense))] font-bold tabular-nums">
                          Debe: $
                          {venta.saldoPendiente.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-[hsl(var(--income))] font-bold flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Pagado
                        </p>
                      )}
                    </div>
                  </div>
                  {venta.detalles?.map((d) => (
                    <p
                      key={d.id}
                      className="text-xs text-muted-foreground"
                    >
                      {d.productoNombre}: {d.cantidad} × $
                      {d.precioUnitario.toLocaleString()}
                    </p>
                  ))}
                </Card>
              );
            }
          })
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            Sin historial
          </p>
        );
      })()}
    </div>
  );
}
