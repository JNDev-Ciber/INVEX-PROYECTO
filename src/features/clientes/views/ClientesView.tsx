

import { User } from "lucide-react";
import { ClientesVentasManager } from "@/features/clientes/components/clientesVentasManager";
import { useClientes } from "@/features/clientes/hooks/use-clientes";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useCurrentUser } from "@/features/auth/context/auth-context";

export default function ClientesView() {
  const products = useProducts();
  const clientes = useClientes();
  const user = useCurrentUser();

  const handleAddCliente = async (
    nombre: string,
    cuit: string,
    telefono: string
  ): Promise<boolean> => {
    const result = await clientes.addCliente(nombre, cuit, telefono);
    return !!result;
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold">Clientes</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ventas a crédito, deudas y pagos por cliente
        </p>
      </div>

      <ClientesVentasManager
        clientes={clientes.clientesVentas}
        ventasFiado={clientes.ventasFiado}
        products={products.products}
        pagos={clientes.pagos}
        onAddCliente={handleAddCliente}
        onAddDeudaDirecta={clientes.addDeudaDirecta}
        onAddVentaFiado={(clienteId, productos) =>
          clientes.addVentaFiado(clienteId, productos, {
            usuarioId: user?.id,
            usuarioNombre: user?.username,
          }) as any
        }
        onMarcarPagados={clientes.marcarProductosPagados}
        onRegistrarPagoParcial={clientes.registrarPagoParcial}
        onSearchProductsPage={products.searchProductsPage}
        onDeleteCliente={clientes.deleteCliente}
      />
    </div>
  );
}
