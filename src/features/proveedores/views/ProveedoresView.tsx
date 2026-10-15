import { Building2 } from "lucide-react";
import { ProveedoresManager } from "@/features/proveedores/components/proveedoresManager";
import { useProveedores } from "@/features/proveedores/hooks/use-proveedores";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useState } from "react";
import type { Proveedor } from "@/shared/types/inventory";

export default function ProveedoresView() {
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | undefined>();
  const proveedores = useProveedores(selectedProveedorId);
  const products = useProducts();

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-base font-semibold">Proveedores</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Compras a crédito, deudas y pagos a proveedores
        </p>
      </div>

      <ProveedoresManager
        proveedores={proveedores.proveedores}
        compras={proveedores.compras}
        pagos={proveedores.pagos}
        products={products.products}
        isLoadingCompras={proveedores.isLoadingCompras}
        onAddProveedor={proveedores.addProveedor}
        onDeleteProveedor={proveedores.deleteProveedor}
        onAddDeudaDirecta={proveedores.addDeudaDirecta}
        onRegistrarPago={proveedores.registrarPago}
        onAddCompraProductos={proveedores.addCompraProductos}
        onSearchProductsPage={products.searchProductsPage}
        onProveedorSelect={setSelectedProveedorId}
      />
    </div>
  );
}
