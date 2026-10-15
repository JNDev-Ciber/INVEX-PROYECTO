

import { DollarSign } from "lucide-react";
import { BulkPriceUpdate } from "@/features/precios/components/bulk-price-update";
import { useProducts } from "@/features/productos/hooks/use-products";

export default function PreciosView() {
  const products = useProducts();
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold">Actualización de precios</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Actualizá precios por categoría de forma masiva
        </p>
      </div>

      <BulkPriceUpdate
        products={products.products}
        onUpdatePrices={products.updatePricesByCategory}
      />
    </div>
  );
}
