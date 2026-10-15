

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import { ProductListTable } from "@/features/productos/components/product-list-table";
import { MovementModal } from "@/features/dashboard/components/MovementModal";
import { useProductActions } from "@/features/productos/hooks/use-product-actions";
import { useCategorias } from "@/features/productos/hooks/use-categorias";
import { useToast } from "@/hooks/use-toast";

export default function ProductosListView() {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const {
    products,
    movements,
    movementFlow,
    predefinedReasons,
    handleEdit,
    handleDelete,
    handleQuickSale,
    handleQuickStock,
    handleBarcodeSave,
    handleDiscountSave,
  } = useProductActions();

  const { categorias } = useCategorias();
  const categories = (categorias || [])
    .map((c: any) => c?.nombre)
    .filter(Boolean);

  const getMovementsByProduct = (productId: string) =>
    movements.movements
      .filter((m) => m.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <List className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Productos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestioná tu inventario: editar, eliminar y mover stock
        </p>
      </div>

      <ProductListTable
        products={products.products}
        categories={categories}
        productsHasMore={products.productsHasMore}
        productsLoadingMore={products.productsLoadingMore}
        onLoadMoreProducts={products.loadMoreProducts}
        onSearchProductsPage={products.searchProductsPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onQuickSale={handleQuickSale}
        onQuickStock={handleQuickStock}
        onBarcodeSave={handleBarcodeSave}
        onDiscountSave={handleDiscountSave}
        getMovementsByProduct={getMovementsByProduct}
        getPriceHistoryByProduct={() => []}
      />

      <MovementModal
        open={movementFlow.showMovementModal}
        onOpenChange={movementFlow.setShowMovementModal}
        movementType={movementFlow.movementType}
        stockInputMode={movementFlow.stockInputMode}
        setStockInputMode={movementFlow.setStockInputMode}
        connectionStatus="connected"
        selectedProduct={movementFlow.selectedProductForMovement}
        movementError={movementFlow.movementError}
        movementQuantity={movementFlow.movementQuantity}
        setMovementQuantity={movementFlow.setMovementQuantity}
        movementUnitValue={movementFlow.movementUnitValue}
        setMovementUnitValue={movementFlow.setMovementUnitValue}
        useCustomReason={movementFlow.useCustomReason}
        setUseCustomReason={movementFlow.setUseCustomReason}
        movementReason={movementFlow.movementReason}
        setMovementReason={movementFlow.setMovementReason}
        customReason={movementFlow.customReason}
        setCustomReason={movementFlow.setCustomReason}
        esOtroDia={movementFlow.esOtroDia}
        setEsOtroDia={movementFlow.setEsOtroDia}
        fechaOtroDia={movementFlow.fechaOtroDia}
        setFechaOtroDia={movementFlow.setFechaOtroDia}
        predefinedReasons={predefinedReasons}
        isSubmitting={movementFlow.isSubmittingMovement}
        onSubmit={async () => {
          try {
            await movementFlow.submitMovement();
          } catch (err) {
            toast({
              title: "Error en movimiento",
              description:
                err instanceof Error
                  ? err.message
                  : "No se pudo procesar el movimiento.",
              variant: "destructive",
              duration: 4000,
            });
          }
        }}
      />
    </div>
  );
}
