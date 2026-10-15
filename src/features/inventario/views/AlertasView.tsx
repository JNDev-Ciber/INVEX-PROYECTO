

import { AlertTriangle } from "lucide-react";
import AlertsPanel from "@/features/inventario/components/low-stock-alerts";

export default function AlertasView() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <h2 className="text-base font-semibold">Alertas</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Clientes con deuda vencida y productos con stock bajo
        </p>
      </div>

      <AlertsPanel />
    </div>
  );
}
