

import { ShoppingCart } from "lucide-react";
import ColaCajaScreen from "@/features/caja/components/ColaCajaScreen";
import { useClientes } from "@/features/clientes/hooks/use-clientes";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useCurrentUser } from "@/features/auth/context/auth-context";

export default function ColaCajaView() {
  const products = useProducts();
  const clientes = useClientes();
  const user = useCurrentUser();

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold">Cola de caja</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Boletas pendientes de aprobación en la caja
        </p>
      </div>

      <ColaCajaScreen
        clientes={clientes.clientesVentas}
        products={products.products}
        onAddVentaFiado={(clienteId, productos, atribucion) =>
          clientes.addVentaFiado(clienteId, productos, atribucion) as any
        }
        currentUser={user}
      />
    </div>
  );
}
