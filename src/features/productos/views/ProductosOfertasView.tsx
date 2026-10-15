

import { Tag } from "lucide-react";
import { ProductsDiscountSection } from "@/features/productos/components/ProductsDiscountSection";
import { useProducts } from "@/features/productos/hooks/use-products";

export default function ProductosOfertasView() {
  const products = useProducts();

  const handleApplyDiscount = async (
    ids: string[],
    percent: number,
    active: boolean
  ) => {
    for (const id of ids) {
      await products.updateDiscount(id, percent, active);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Ofertas y descuentos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Aplicá descuentos masivos por producto o categoría
        </p>
      </div>

      <ProductsDiscountSection
        products={products.products}
        productsHasMore={products.productsHasMore}
        productsLoadingMore={products.productsLoadingMore}
        onLoadMoreProducts={products.loadMoreProducts}
        onSearchProductsPage={products.searchProductsPage}
        connectionStatus="connected"
        onApplyDiscount={handleApplyDiscount}
      />
    </div>
  );
}
