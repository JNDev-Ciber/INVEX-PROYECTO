

import { DollarSign } from "lucide-react";
import PresupuestoForm from "@/features/presupuestos/components/presupuestoForm";
import { useProducts } from "@/features/productos/hooks/use-products";

export default function PresupuestosView() {
  const products = useProducts();
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold">Presupuestos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Generá presupuestos para tus clientes
        </p>
      </div>

      <PresupuestoForm
        products={products.products}
        onSearchProductsPage={products.searchProductsPage}
        onLookupProductByBarcode={products.getProductByBarcode}
      />
    </div>
  );
}
