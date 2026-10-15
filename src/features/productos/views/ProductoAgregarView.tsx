import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/features/productos/components/product-form";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useCategorias } from "@/features/productos/hooks/use-categorias";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/shared/types/inventory";

export default function ProductoAgregarView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, addProduct } = useProducts();
  const { categorias } = useCategorias();
  const categories = (categorias || [])
    .map((c: any) => c?.nombre)
    .filter(Boolean);

  const handleSubmit = async (
    data: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await addProduct(data);
      toast({ title: "Producto agregado correctamente", duration: 3000 });
      navigate("/productos");
    } catch (err) {
      toast({
        title: "Error al agregar producto",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/productos")}
          className="mb-3 -ml-1 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a productos
        </Button>
        <div className="flex items-center gap-2 mb-0.5">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Agregar producto</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Completá los datos para agregar un nuevo producto al inventario
        </p>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        existingCodes={products.map((p) => p.code)}
        products={products}
        categories={categories}
        onCancel={() => navigate("/productos")}
      />
    </div>
  );
}
