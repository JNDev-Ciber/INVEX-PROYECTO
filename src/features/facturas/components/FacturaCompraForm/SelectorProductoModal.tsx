
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Package, Search, Lightbulb } from "lucide-react"
import type { Product } from "@/shared/types/inventory"

interface Props {
  mostrarSelectorProducto: boolean
  setMostrarSelectorProducto: React.Dispatch<React.SetStateAction<boolean>>
  setMostrarCrearProducto: React.Dispatch<React.SetStateAction<boolean>>
  busquedaProducto: string
  setBusquedaProducto: React.Dispatch<React.SetStateAction<string>>
  productosFiltrados: Product[]
  seleccionarProducto: (product: Product) => void
}

export function SelectorProductoModal({
  mostrarSelectorProducto,
  setMostrarSelectorProducto,
  setMostrarCrearProducto,
  busquedaProducto,
  setBusquedaProducto,
  productosFiltrados,
  seleccionarProducto,
}: Props) {
  return (
    <Dialog open={mostrarSelectorProducto} onOpenChange={setMostrarSelectorProducto}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Seleccionar producto del inventario</span>
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-muted border rounded-lg px-3 py-2 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">
                  ¿No encuentra su producto?
                </span>
                <Button
                  onClick={() => setMostrarCrearProducto(true)}
                  size="sm"
                  className="px-3 py-1 text-xs"
                >
                  Crear producto
                </Button>
              </div>
            </div>
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

          {busquedaProducto && productosFiltrados.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/40">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontró "{busquedaProducto}"
              </h3>
              <p className="text-muted-foreground mb-4">
                El producto no existe en su inventario
              </p>
              <Button onClick={() => setMostrarCrearProducto(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear producto "{busquedaProducto}"
              </Button>
            </div>
          )}

          {/* Lista de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {productosFiltrados.map((product) => (
              <div
                key={product.id}
                className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => seleccionarProducto(product)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">Código: {product.code}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Costo actual:</span>
                    <p className="font-medium tabular-nums">${product.cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Precio actual:</span>
                    <p className="font-medium tabular-nums text-[hsl(var(--income))]">${product.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>
                    <p className="font-medium tabular-nums">{product.quantity} unidades</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margen:</span>
                    <p className="font-medium tabular-nums">{((product.price - product.cost) / product.price * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {product.description && (
                  <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{product.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Mensaje cuando no hay búsqueda */}
          {productosFiltrados.length === 0 && !busquedaProducto && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Escribí para buscar productos en tu inventario</p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span><strong>Tip:</strong> si no encuentra el producto que necesita, puede crearlo directamente desde acá usando el botón "Crear producto" de arriba.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
