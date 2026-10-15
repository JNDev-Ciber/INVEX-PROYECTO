

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, X, ShoppingCart } from "lucide-react";
import type { Product } from "@/shared/types/inventory";

interface ProductoVentaItem {
  productoId: string;
  cantidad: number;
  product?: Product;
}

interface NuevaVentaProductosTabProps {
  productSearchTerm: string;
  setProductSearchTerm: (v: string) => void;
  suggestedProducts: Product[];
  productosVenta: ProductoVentaItem[];
  setProductosVenta: (items: ProductoVentaItem[]) => void;
  allKnownProducts: Product[];
  isLoading: boolean;
  calcularTotalVenta: () => number;
  agregarProductoRapido: (product: Product) => void;
  onRegistrarVenta: () => void;
}

export function NuevaVentaProductosTab({
  productSearchTerm,
  setProductSearchTerm,
  suggestedProducts,
  productosVenta,
  setProductosVenta,
  allKnownProducts,
  isLoading,
  calcularTotalVenta,
  agregarProductoRapido,
  onRegistrarVenta,
}: NuevaVentaProductosTabProps) {
  return (
    <>
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        Nueva Venta
      </h3>

      {/* Buscador rápido */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Buscar producto..."
          value={productSearchTerm}
          onChange={(e) => setProductSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Productos sugeridos */}
      {productSearchTerm && suggestedProducts.length > 0 && (
        <div className="mb-3 max-h-40 overflow-y-auto bg-card rounded border">
          {suggestedProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                agregarProductoRapido(p);
                setProductSearchTerm("");
              }}
              className="w-full p-2 hover:bg-emerald-100 text-left border-b last:border-b-0 transition-colors"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {p.quantity}
                  </p>
                </div>
                <p className="font-bold text-emerald-600">
                  ${p.price.toLocaleString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Productos en carrito */}
      {productosVenta.length > 0 && (
        <div className="space-y-2 mb-3">
          {productosVenta.map((item, idx) => {
            const producto =
              item.product ??
              allKnownProducts.find((p) => p.id === item.productoId);
            return (
              <div
                key={idx}
                className="flex gap-2 items-center bg-card p-2 rounded border"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {producto?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${producto?.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (item.cantidad > 1) {
                        const newItems = [...productosVenta];
                        newItems[idx].cantidad--;
                        setProductosVenta(newItems);
                      }
                    }}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center font-semibold">
                    {item.cantidad}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        item.cantidad < (producto?.quantity || 999)
                      ) {
                        const newItems = [...productosVenta];
                        newItems[idx].cantidad++;
                        setProductosVenta(newItems);
                      }
                    }}
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setProductosVenta(
                      productosVenta.filter((_, i) => i !== idx)
                    )
                  }
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            );
          })}

          {/* Total */}
          <div className="bg-card p-3 rounded border-2 border-emerald-400 flex justify-between items-center">
            <span className="font-bold">TOTAL:</span>
            <span className="text-2xl font-bold text-emerald-600">
              ${calcularTotalVenta().toLocaleString()}
            </span>
          </div>

          {/* Botón Registrar Venta */}
          <Button
            onClick={onRegistrarVenta}
            disabled={isLoading}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            Registrar Venta
          </Button>
        </div>
      )}
    </>
  );
}
