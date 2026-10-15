

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Plus,
  Package,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import type { Product } from "@/shared/types/inventory";
import type { NuevoItemState } from "./types";

interface Props {
  productoSeleccionado: Product | null;
  setProductoSeleccionado: React.Dispatch<React.SetStateAction<Product | null>>;
  nuevoItem: NuevoItemState;
  handleNumericChange: (
    value: string,
    field: "cantidad" | "precioUnitario"
  ) => void;
  agregarItem: () => void;
  setMostrarSelectorProducto: React.Dispatch<React.SetStateAction<boolean>>;
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
        <CardTitle className="text-primary flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Agregar productos a vender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Producto seleccionado */}
        {productoSeleccionado ? (
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-foreground">
                  {productoSeleccionado.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Código: {productoSeleccionado.code}
                </p>
                <Badge variant="outline" className="mt-1">
                  {productoSeleccionado.category}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Stock disponible:</strong>{" "}
                  {productoSeleccionado.quantity} unidades
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductoSeleccionado(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cantidad">Cantidad a vender *</Label>
                <Input
                  id="cantidad"
                  type="text"
                  inputMode="decimal"
                  value={nuevoItem.cantidad}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, "cantidad")
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {productoSeleccionado.quantity} unidades
                </p>
              </div>
              <div>
                <Label htmlFor="precioUnitario">Precio unitario *</Label>
                <Input
                  id="precioUnitario"
                  type="text"
                  inputMode="decimal"
                  value={nuevoItem.precioUnitario}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, "precioUnitario")
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={agregarItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Mostrar subtotal del producto actual */}
            {nuevoItem.cantidad && nuevoItem.precioUnitario && (
              <div className="mt-4 p-3 bg-card rounded border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="font-medium text-[hsl(var(--income))] tabular-nums">
                    $
                    {(
                      (parseFloat(nuevoItem.cantidad) || 0) *
                      (parseFloat(nuevoItem.precioUnitario) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  <span>Stock después de venta:</span>
                  <span>
                    {productoSeleccionado.quantity -
                      (parseFloat(nuevoItem.cantidad) || 0)}{" "}
                    unidades
                  </span>
                </div>
                {(parseFloat(nuevoItem.cantidad) || 0) >
                  productoSeleccionado.quantity && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-xs">
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Cantidad excede el stock disponible</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Seleccioná un producto de tu inventario
            </p>
            <Button
              onClick={() => setMostrarSelectorProducto(true)}
              variant="outline"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar producto
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
