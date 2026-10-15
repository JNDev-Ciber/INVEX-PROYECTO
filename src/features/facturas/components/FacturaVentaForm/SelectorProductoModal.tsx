

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, BarChart3, AlertTriangle } from "lucide-react";
import type { Product } from "@/shared/types/inventory";

interface Props {
  mostrarSelectorProducto: boolean;
  setMostrarSelectorProducto: React.Dispatch<React.SetStateAction<boolean>>;
  busquedaProducto: string;
  setBusquedaProducto: React.Dispatch<React.SetStateAction<string>>;
  barcodeInput: string;
  setBarcodeInput: React.Dispatch<React.SetStateAction<string>>;
  productosFiltrados: Product[];
  agregarProductoDelModal: (product: Product) => void;
}

export function SelectorProductoModal({
  mostrarSelectorProducto,
  setMostrarSelectorProducto,
  busquedaProducto,
  setBusquedaProducto,
  barcodeInput,
  setBarcodeInput,
  productosFiltrados,
  agregarProductoDelModal,
}: Props) {
  return (
    <Dialog
      open={mostrarSelectorProducto}
      onOpenChange={setMostrarSelectorProducto}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Seleccionar producto del inventario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o categoría..."
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lector de barras */}
          <div className="p-4 border-2 border-primary/40 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <label className="text-sm font-semibold text-primary">
                O escaneá código de barras:
              </label>
            </div>
            <Input
              autoFocus
              placeholder="Escaneá aquí..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="bg-background"
            />
            <div className="text-xs text-primary/70 mt-2">
              Listo para escanear
            </div>
          </div>

          {/* Lista de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {productosFiltrados.map((product) => (
              <div
                key={product.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  product.quantity > 0
                    ? "hover:bg-accent border-border"
                    : "bg-muted border-border cursor-not-allowed opacity-60"
                }`}
                onClick={() =>
                  product.quantity > 0 && agregarProductoDelModal(product)
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Código: {product.code}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Precio:</span>
                    <p className="font-medium tabular-nums">
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>
                    <p
                      className={`font-medium tabular-nums ${
                        product.quantity > 0
                          ? "text-[hsl(var(--income))]"
                          : "text-destructive"
                      }`}
                    >
                      {product.quantity} unidades
                    </p>
                  </div>
                </div>

                {product.description && (
                  <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {product.quantity === 0 && (
                  <div className="mt-2 text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Sin stock disponible
                  </div>
                )}
              </div>
            ))}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
