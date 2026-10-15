
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Package, Search, TrendingUp, ArrowUpRight } from "lucide-react"
import type { Product } from "@/shared/types/inventory"
import type { NuevoItemState } from "./types"

interface Props {
  productoSeleccionado: Product | null
  setProductoSeleccionado: React.Dispatch<React.SetStateAction<Product | null>>
  nuevoItem: NuevoItemState
  handleNumericChange: (value: string, field: 'cantidad' | 'costoUnitario' | 'precioVentaUnitario') => void
  agregarItem: () => void
  setMostrarSelectorProducto: React.Dispatch<React.SetStateAction<boolean>>
}

export function AgregarProductosCard({
  productoSeleccionado,
  setProductoSeleccionado,
  nuevoItem,
  handleNumericChange,
  agregarItem,
  setMostrarSelectorProducto,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Agregar Productos Comprados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Producto seleccionado */}
        {productoSeleccionado ? (
          <div className="p-4 border rounded-lg bg-green-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-green-700">{productoSeleccionado.name}</h4>
                <p className="text-sm text-green-600">Código: {productoSeleccionado.code}</p>
                <Badge variant="outline" className="mt-1">{productoSeleccionado.category}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductoSeleccionado(null)}
              >
                Cambiar
              </Button>
            </div>

            {/* Grid con 4 columnas - AGREGADO PRECIO DE VENTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cantidad">Cantidad Comprada *</Label>
                <Input
                  id="cantidad"
                  type="text"
                  inputMode="decimal"
                  value={nuevoItem.cantidad}
                  onChange={(e) => handleNumericChange(e.target.value, 'cantidad')}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="costoUnitario">Costo Unitario *</Label>
                <Input
                  id="costoUnitario"
                  type="text"
                  inputMode="decimal"
                  value={nuevoItem.costoUnitario}
                  onChange={(e) => handleNumericChange(e.target.value, 'costoUnitario')}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="precioVentaUnitario">Precio de Venta *</Label>
                <Input
                  id="precioVentaUnitario"
                  type="text"
                  inputMode="decimal"
                  value={nuevoItem.precioVentaUnitario}
                  onChange={(e) => handleNumericChange(e.target.value, 'precioVentaUnitario')}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={agregarItem}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Mostrar información actualizada */}
            {nuevoItem.cantidad && nuevoItem.costoUnitario && nuevoItem.precioVentaUnitario && (
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal compra:</span>
                    <span className="font-medium text-green-600">
                      ${((parseFloat(nuevoItem.cantidad) || 0) * (parseFloat(nuevoItem.costoUnitario) || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Margen estimado:</span>
                    <span className="font-medium text-blue-600">
                      {((parseFloat(nuevoItem.precioVentaUnitario) - parseFloat(nuevoItem.costoUnitario)) / parseFloat(nuevoItem.precioVentaUnitario) * 100 || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Costo actual en sistema:</span>
                    <span>${productoSeleccionado.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio actual en sistema:</span>
                    <span>${productoSeleccionado.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Indicadores de cambios */}
                <div className="mt-2 space-y-1">
                  {parseFloat(nuevoItem.costoUnitario) !== productoSeleccionado.cost && (
                    <div className="p-2 bg-yellow-50 rounded text-xs">
                      <div className="flex items-center gap-1 text-yellow-700">
                        <TrendingUp className="h-3 w-3" />
                        <span>Costo se actualizará: ${productoSeleccionado.cost.toLocaleString()} → ${parseFloat(nuevoItem.costoUnitario).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {parseFloat(nuevoItem.precioVentaUnitario) !== productoSeleccionado.price && (
                    <div className="p-2 bg-blue-50 rounded text-xs">
                      <div className="flex items-center gap-1 text-blue-700">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Precio se actualizará: ${productoSeleccionado.price.toLocaleString()} → ${parseFloat(nuevoItem.precioVentaUnitario).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Selecciona un producto de tu inventario</p>
            <Button
              onClick={() => setMostrarSelectorProducto(true)}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar Producto
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
