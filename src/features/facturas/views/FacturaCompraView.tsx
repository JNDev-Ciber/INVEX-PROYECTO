

import { Building2 } from "lucide-react";
import FacturaCompraForm from "@/features/facturas/components/FacturaCompraForm";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { useProveedores } from "@/features/proveedores/hooks/use-proveedores";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/shared/types/inventory";
import type { ProductoCompra } from "@/mocks/compras-proveedor";

export default function FacturaCompraView() {
  const { toast } = useToast();
  const products = useProducts();
  const movements = useMovements();
  const proveedoresData = useProveedores();
  const { proveedores } = proveedoresData;

  const onUpdateProductCost = async (productId: string, newCost: number) => {
    try {
      await products.updateProduct(productId, { cost: newCost });
      toast({
        title: "Costo actualizado",
        description: `Costo actualizado a $${newCost.toLocaleString()}`,
        duration: 3000,
      });
    } catch {
      toast({ title: "Error al actualizar costo", variant: "destructive" });
      throw new Error("Error al actualizar costo");
    }
  };

  const onUpdateProductPrice = async (productId: string, newPrice: number) => {
    try {
      await products.updateProduct(productId, { price: newPrice });
      toast({
        title: "Precio actualizado",
        description: `Precio actualizado a $${newPrice.toLocaleString()}`,
        duration: 3000,
      });
    } catch {
      toast({ title: "Error al actualizar precio", variant: "destructive" });
      throw new Error("Error al actualizar precio");
    }
  };

  const onAddMovement = async (
    productId: string,
    quantity: number,
    reason: string
  ) => {
    try {
      await movements.addMovement(productId, "salida", quantity, reason);
      toast({
        title: "Stock agregado",
        description: `Se agregaron ${quantity} unidades`,
        duration: 3000,
      });
    } catch {
      toast({ title: "Error al agregar stock", variant: "destructive" });
      throw new Error("Error al agregar stock");
    }
  };

  const onRegistrarCompraProveedor = async (
    proveedorId: string,
    productosCompra: ProductoCompra[],
    concepto?: string
  ) => {
    try {
      await proveedoresData.addCompraProductos(proveedorId, productosCompra, concepto);
    } catch {
      toast({ title: "Error al registrar deuda al proveedor", variant: "destructive" });
      throw new Error("Error al registrar compra al proveedor");
    }
  };

  const onCreateProduct = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> => {
    try {
      const newId = await products.addProduct(productData);
      toast({
        title: "Producto creado",
        description: `${productData.name} se agregó al inventario`,
        duration: 3000,
      });
      return {
        ...productData,
        id: String(newId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;
    } catch {
      toast({ title: "Error al crear producto", variant: "destructive" });
      throw new Error("Error al crear producto");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold">Factura de compra</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Registrá una compra a proveedor y actualizá el inventario
        </p>
      </div>

      <FacturaCompraForm
        products={products.products}
        proveedores={proveedores}
        onUpdateProductCost={onUpdateProductCost}
        onUpdateProductPrice={onUpdateProductPrice}
        onAddMovement={onAddMovement}
        onCreateProduct={onCreateProduct}
        onRegistrarCompraProveedor={onRegistrarCompraProveedor}
      />
    </div>
  );
}
