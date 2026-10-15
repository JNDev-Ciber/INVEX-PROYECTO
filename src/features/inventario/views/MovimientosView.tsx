

import { TrendingUp } from "lucide-react";
import { MovementHistory } from "@/features/inventario/components/movement-history";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { useProducts } from "@/features/productos/hooks/use-products";

export default function MovimientosView() {
  const { products } = useProducts();
  const { movements, clearAllMovements } = useMovements();

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold">Movimientos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Historial de entradas y salidas de inventario
        </p>
      </div>

      <MovementHistory
        movements={movements}
        products={products}
        onClearMovements={clearAllMovements}
      />
    </div>
  );
}
