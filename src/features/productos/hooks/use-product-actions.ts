import { createElement, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Package, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const titleWithIcon = (Icon: typeof CheckCircle2, text: string) =>
  createElement(
    "span",
    { className: "flex items-center gap-2" },
    createElement(Icon, { className: "h-4 w-4" }),
    text
  );
import { useProducts } from "@/features/productos/hooks/use-products";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { useMovementFlow } from "@/features/inventario/hooks/use-movement-flow";
import { useCurrentUser } from "@/features/auth/context/auth-context";
import type { Product } from "@/shared/types/inventory";

const DISCOUNT_PERCENT_CASH = 10;

export const PREDEFINED_REASONS = {
  salida: [
    "Compra a proveedor",
    "Devolución de cliente",
    "Reposición de stock",
    "Ajuste de inventario (corrección)",
    "Transferencia desde otra sucursal",
    "Producto en consignación",
    "Recuperación de producto reparado",
  ],
  entrada: [
    "Venta a cliente",
    "Venta online",
    "Producto defectuoso/dañado",
    "Muestra para cliente",
    "Transferencia a otra sucursal",
    "Devolución a proveedor",
    "Robo/pérdida",
    "Producto vencido/obsoleto",
    "Uso interno/demostración",
  ],
};

/**
 * Hook compuesto: agrupa productos + movimientos + flujo de modales para Pages que
 * necesitan acciones rápidas (vender, agregar stock, editar, etc).
 */
export function useProductActions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const products = useProducts();
  const movements = useMovements();
  const currentUser = useCurrentUser();

  const movementFlow = useMovementFlow({
    connectionStatus: "connected",
    addMovement: movements.addMovement,
    adjustStockTotal: movements.adjustStockTotal,
    currentUser,
    onMovementSuccess: ({ product, type, quantity }) => {
      const actionText = type === "entrada" ? "registró venta" : "agregó stock";
      toast({
        title: titleWithIcon(
          type === "entrada" ? ShoppingCart : Package,
          type === "entrada" ? "Venta registrada" : "Stock agregado"
        ),
        description: `Se ${actionText} de ${quantity} unidades para ${product.name}.`,
        duration: 3000,
      });
    },
  });

  const handleEdit = useCallback(
    (product: Product) => {
      navigate(`/productos/editar/${encodeURIComponent(product.id)}`, {
        state: { product },
      });
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await products.deleteProduct(id);
        toast({ title: titleWithIcon(CheckCircle2, "Producto eliminado"), duration: 3000 });
        return true;
      } catch (e) {
        toast({
          title: titleWithIcon(XCircle, "Error al eliminar"),
          description: e instanceof Error ? e.message : "Error desconocido",
          variant: "destructive",
        });
        return false;
      }
    },
    [products, toast]
  );

  const handleBarcodeSave = useCallback(
    async (productId: string, barcode: string) => {
      try {
        await products.updateBarcode(productId, barcode);
        toast({ title: titleWithIcon(CheckCircle2, "Código de barras guardado"), duration: 3000 });
        return true;
      } catch (e) {
        toast({
          title: titleWithIcon(XCircle, "Error al guardar código"),
          description: e instanceof Error ? e.message : "Error desconocido",
          variant: "destructive",
        });
        throw e;
      }
    },
    [products, toast]
  );

  const handleDiscountSave = useCallback(
    async (
      productId: string,
      discountPercent: number,
      discountActive: boolean
    ) => {
      try {
        await products.updateDiscount(productId, discountPercent, discountActive);
        toast({
          title: titleWithIcon(CheckCircle2, "Descuento guardado"),
          description: discountActive
            ? `-${discountPercent}% aplicado`
            : "Descuento desactivado",
          duration: 2500,
        });
        return true;
      } catch (e) {
        toast({
          title: titleWithIcon(XCircle, "Error al guardar descuento"),
          description: e instanceof Error ? e.message : "Error desconocido",
          variant: "destructive",
        });
        throw e;
      }
    },
    [products, toast]
  );

  const handleApplyDiscount = useCallback(
    async (ids: string[], percent: number, active: boolean) => {
      for (const id of ids) {
        await products.updateDiscount(id, percent, active);
      }
    },
    [products]
  );

  const handleQuickSale = useCallback(
    async (product: Product, paymentType?: "cash" | "credit") => {
      if (!paymentType) {
        movementFlow.openQuickSale(product);
        return;
      }
      const discountPercent =
        product.discountPercent != null ? Number(product.discountPercent) : 0;
      const hasProductDiscount =
        Boolean(product.discountActive) && discountPercent > 0;
      const baseUnitPrice = hasProductDiscount
        ? Math.round((product.price ?? 0) * (1 - discountPercent / 100))
        : Math.round(product.price ?? 0);
      const unitPrice =
        paymentType === "cash"
          ? Math.round(baseUnitPrice * (1 - DISCOUNT_PERCENT_CASH / 100))
          : Math.round(baseUnitPrice);

      movementFlow.openQuickSale(product);
      movementFlow.setMovementUnitValue(String(unitPrice));
      movementFlow.setMovementReason(
        paymentType === "cash"
          ? `Venta rápida (Débito/Efectivo -${DISCOUNT_PERCENT_CASH}%)`
          : "Venta rápida (Crédito)"
      );
      movementFlow.setMovementMetodoPago(
        paymentType === "cash" ? "debito" : "credito"
      );
    },
    [movementFlow]
  );

  return {
    products,
    movements,
    movementFlow,
    predefinedReasons: PREDEFINED_REASONS,
    handleEdit,
    handleDelete,
    handleBarcodeSave,
    handleDiscountSave,
    handleApplyDiscount,
    handleQuickSale,
    handleQuickStock: movementFlow.openQuickStock,
  };
}
