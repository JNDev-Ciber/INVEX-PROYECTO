

import { CreditCard } from "lucide-react";
import FacturaVentaForm from "@/features/facturas/components/FacturaVentaForm";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { useClientes } from "@/features/clientes/hooks/use-clientes";
import { useCurrentUser } from "@/features/auth/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { ClienteVenta, MetodoPago } from "@/shared/types/inventory";

export default function FacturaVentaView() {
  const { toast } = useToast();
  const user = useCurrentUser();
  const products = useProducts();
  const movements = useMovements();
  const clientes = useClientes();

  const handleAddCliente = async (
    nombre: string,
    cuit: string,
    telefono: string
  ): Promise<ClienteVenta | undefined> => {
    try {
      const result = await clientes.addCliente(nombre, cuit, telefono);
      if (result && typeof result === "object") {
        return {
          id: (result as any).id || 0,
          nombre: (result as any).nombre || nombre,
          cuit: (result as any).cuit || cuit,
          telefono: (result as any).telefono || telefono,
          saldoPendiente: (result as any).saldoPendiente || 0,
        } as ClienteVenta;
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  const onSaleProduct = async (
    productId: string,
    quantity: number,
    reason: string,
    precioVendido?: number,
    metodoPago?: MetodoPago
  ) => {
    try {
      const producto = products.products.find((p) => p.id === productId);
      const precioFinal = precioVendido || producto?.price || 0;
      await movements.addMovement(
        productId,
        "entrada",
        quantity,
        reason,
        precioFinal,
        {
          usuarioId: user?.id,
          usuarioNombre: user?.username,
          metodoPago,
        }
      );
      toast({
        title: "Venta registrada",
        description: `${quantity} unidades a $${precioFinal.toLocaleString()}`,
        duration: 3000,
      });
    } catch {
      toast({ title: "Error en la venta", variant: "destructive" });
      throw new Error("Error en la venta");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold">Factura de venta</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Emití una factura de venta para clientes
        </p>
      </div>

      <FacturaVentaForm
        products={products.products}
        clientes={clientes.clientesVentas}
        onLookupProductByBarcode={products.getProductByBarcode}
        onSearchProductsPage={products.searchProductsPage}
        onAddVentaFiado={(clienteId, productos) =>
          clientes.addVentaFiado(clienteId, productos, {
            usuarioId: user?.id,
            usuarioNombre: user?.username,
          }) as any
        }
        addCliente={handleAddCliente}
        currentUser={user}
        onSaleProduct={onSaleProduct}
      />
    </div>
  );
}
