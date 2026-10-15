
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Trash2, TrendingUp } from "lucide-react"
import type { FacturaCompra } from "./types"

interface Props {
  facturaActual: FacturaCompra
  porcentajeIva: number
  eliminarItem: (itemId: string) => void
}

export function ItemsListCard({ facturaActual, porcentajeIva, eliminarItem }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Productos en la Factura de Compra ({facturaActual.items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lista de items */}
          <div className="space-y-2">
            {facturaActual.items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center p-3 border rounded-lg bg-gray-50 gap-2">
                <div className="flex items-start justify-between sm:flex-1 min-w-0">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{item.producto.name}</div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2">
                      <span>Cód: {item.producto.code}</span>
                      <span>Cant: {item.cantidad}</span>
                      <span>Costo: ${item.costoUnitario.toLocaleString()}</span>
                      <span>Venta: ${item.precioVentaUnitario.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.producto.category}</Badge>
                      {(item.costoUnitario !== item.producto.cost || item.precioVentaUnitario !== item.producto.price) && (
                        <Badge variant="secondary" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Precios actualizados
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => eliminarItem(item.id)} className="text-red-600 hover:text-red-700 sm:hidden flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <span className="font-bold text-green-600">${item.subtotal.toLocaleString()}</span>
                  <Button variant="outline" size="sm" onClick={() => eliminarItem(item.id)} className="text-red-600 hover:text-red-700 hidden sm:flex">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totales */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${facturaActual.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA ({porcentajeIva}%):</span>
                <span>${facturaActual.iva.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>TOTAL:</span>
                <span>${facturaActual.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
