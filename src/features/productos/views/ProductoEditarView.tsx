import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, PackageX, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/features/productos/components/product-form";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useCategorias } from "@/features/productos/hooks/use-categorias";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/shared/types/inventory";

export default function ProductoEditarView() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { products, updateProduct, isLoading } = useProducts();
  const { categorias } = useCategorias();
  const categories = (categorias || [])
    .map((c: any) => c?.nombre)
    .filter(Boolean);

  const productFromState = (location.state as { product?: Product } | null)?.product;
  const editing =
    products.find((p) => String(p.id) === String(id)) ??
    (productFromState && String(productFromState.id) === String(id)
      ? productFromState
      : undefined);

  if (!editing) {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/productos")}
          className="-ml-1 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Button>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando producto...
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <PackageX className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">Producto no encontrado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Puede que haya sido eliminado o el enlace esté desactualizado.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate("/productos")}>
              Volver a productos
            </Button>
          </div>
        )}
      </div>
    );
  }

  const handleSubmit = async (
    data: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await updateProduct(editing.id, data);
      toast({ title: "Producto actualizado correctamente", duration: 3000 });
      navigate("/productos");
    } catch (err) {
      toast({
        title: "Error al actualizar producto",
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
          <Pencil className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Editar producto</h2>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {editing.name}
        </p>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        initialData={editing}
        editing
        isEditing
        existingCodes={products.map((p) => p.code)}
        products={products}
        categories={categories}
        onCancel={() => navigate("/productos")}
      />
    </div>
  );
}
