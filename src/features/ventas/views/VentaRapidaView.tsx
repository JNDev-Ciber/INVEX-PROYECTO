

import { ShoppingCart } from "lucide-react";
import { QuickSaleForm } from "@/features/ventas/components/quickSaleForm";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { useCurrentUser } from "@/features/auth/context/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function VentaRapidaView() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const products = useProducts();
  const movements = useMovements();

  const handleSaleComplete = async (
    items: any[],
    metodoPago: "debito" | "credito",
    clienteId: number | null
  ) => {
    try {
      const reason =
        metodoPago === "debito" ? "Venta rápida (Débito/Efectivo)" : "Venta rápida (Crédito)";
      await movements.addVenta({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price:
            item.quantity > 0
              ? Math.round(Number(item.subtotal || 0) / Number(item.quantity))
              : null,
        })),
        reason,
        clienteId,
        atribucion: {
          usuarioId: user?.id,
          usuarioNombre: user?.username,
          metodoPago,
        },
      });
      toast({
        title: "Venta registrada",
        description: `${items.length} producto(s) vendido(s)`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error al registrar venta",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold">Venta rápida</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Escaneá códigos de barras para registrar ventas
        </p>
      </div>
      <QuickSaleForm
        products={products.products}
        onLookupProductByBarcode={products.getProductByBarcode}
        onSaleComplete={handleSaleComplete}
        currentUser={user}
      />
    </div>
  );
}
