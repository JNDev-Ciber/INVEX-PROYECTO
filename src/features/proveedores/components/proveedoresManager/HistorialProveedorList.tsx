import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Check } from "lucide-react";
import type { CompraProveedor, PagoProveedor } from "@/shared/types/inventory";
import { formatFechaLocal } from "@/shared/lib/date";

interface HistorialProveedorListProps {
  compras: CompraProveedor[];
  pagos: PagoProveedor[];
  isLoading: boolean;
}

export function HistorialProveedorList({
  compras,
  pagos,
  isLoading,
}: HistorialProveedorListProps) {
  if (isLoading) {
    return <p className="text-center py-8 text-muted-foreground">Cargando historial...</p>;
  }

  const historial = [
    ...compras.map((c) => ({ tipo: "compra" as const, data: c, fecha: new Date(c.fecha) })),
    ...pagos.map((p) => ({ tipo: "pago" as const, data: p, fecha: new Date(p.fecha) })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  if (historial.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">Sin historial</p>;
  }

  return (
    <div className="space-y-3">
      {historial.map((item, idx) => {
        if (item.tipo === "pago") {
          const pago = item.data as PagoProveedor;
          return (
            <Card key={`pago-${pago.id}-${idx}`} className="p-4 border-l-4 border-l-[hsl(var(--expense))]">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatFechaLocal(pago.fecha)}
                  </p>
                  <p className="text-[hsl(var(--expense))] font-bold flex items-center gap-2 tabular-nums">
                    <DollarSign className="h-4 w-4" />
                    Pago realizado: ${pago.monto.toLocaleString()}
                  </p>
                  {pago.concepto && (
                    <p className="text-xs text-muted-foreground mt-1">{pago.concepto}</p>
                  )}
                </div>
                <Badge className="bg-[hsl(var(--expense))]/10 text-[hsl(var(--expense))] border-[hsl(var(--expense))]/30 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Pago
                </Badge>
              </div>
            </Card>
          );
        }

        const compra = item.data as CompraProveedor;
        return (
          <Card
            key={`compra-${compra.id}-${idx}`}
            className={`p-4 border-l-4 ${
              compra.saldoPendiente > 0 ? "border-l-[hsl(var(--expense))]" : "border-l-muted-foreground/30"
            }`}
          >
            <div className="flex justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  {formatFechaLocal(compra.fecha)}
                </p>
                <p className="font-bold tabular-nums">Total: ${compra.total.toLocaleString()}</p>
                {compra.saldoPendiente > 0 ? (
                  <p className="text-[hsl(var(--expense))] font-semibold text-sm tabular-nums">
                    Pendiente: ${compra.saldoPendiente.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-muted-foreground font-semibold text-sm flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Pagado
                  </p>
                )}
                {compra.concepto && (
                  <p className="text-xs text-muted-foreground">{compra.concepto}</p>
                )}
              </div>
              <Badge variant="outline" className="shrink-0">
                <Package className="h-3 w-3 mr-1" />
                Compra
              </Badge>
            </div>

            {Array.isArray(compra.detalles) && compra.detalles.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {compra.detalles.map((d, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {d.nombre}: {d.cantidad} × ${Number(d.precioUnitario ?? (d as any).precio_unitario).toLocaleString()}
                  </p>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
