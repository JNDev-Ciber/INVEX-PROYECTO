

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Trash2, TrendingDown } from "lucide-react";
import type { FacturaVenta, FacturaVentaItem } from "./types";

interface Props {
  facturaActual: FacturaVenta;
  setItems: React.Dispatch<React.SetStateAction<FacturaVentaItem[]>>;
  porcentajeIva: number;
  totalConDebitoEfectivo: number;
  totalConTarjeta: number;
  DISCOUNT_PERCENT_CASH: number;
  SURCHARGE_PERCENT_CARD: number;
  eliminarItem: (itemId: string) => void;
  toast: (args: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    duration?: number;
  }) => void;
}

export function ItemsListCard({
  facturaActual,
  setItems,
  porcentajeIva,
  totalConDebitoEfectivo,
  totalConTarjeta,
  DISCOUNT_PERCENT_CASH,
  SURCHARGE_PERCENT_CARD,
  eliminarItem,
  toast,
}: Props) {
  if (facturaActual.items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-blue-600 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Productos en la Factura de Venta ({facturaActual.items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lista de items EDITABLES */}
          <div className="space-y-2">
            {facturaActual.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center p-3 border rounded-lg bg-gray-50 gap-3"
              >
                {/* Información del producto + botón eliminar en mobile */}
                <div className="flex items-start justify-between sm:flex-1 min-w-0">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {item.producto.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Código: {item.producto.code}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.producto.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Stock: {item.producto.quantity}
                      </Badge>
                    </div>
                  </div>
                  {/* Botón eliminar visible en mobile arriba a la derecha */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarItem(item.id)}
                    className="text-red-600 hover:text-red-700 sm:hidden flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Inputs + subtotal + eliminar (desktop) */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Cantidad */}
                  <div className="flex flex-col gap-1 w-20 sm:w-24">
                    <Label htmlFor={`cantidad-${item.id}`} className="text-xs">
                      Cantidad
                    </Label>
                    <Input
                      id={`cantidad-${item.id}`}
                      type="text"
                      value={item.cantidad}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const nuevaCantidad = parseFloat(valor);
                        if (valor === "") {
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...i, cantidad: 0, subtotal: 0 } : i
                            )
                          );
                          return;
                        }
                        if (isNaN(nuevaCantidad) || nuevaCantidad < 0) return;
                        if (nuevaCantidad > item.producto.quantity) {
                          toast({
                            title: "Stock insuficiente",
                            description: `Solo hay ${item.producto.quantity} unidades`,
                            variant: "destructive",
                            duration: 2000,
                          });
                          return;
                        }
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * i.precioUnitario }
                              : i
                          )
                        );
                      }}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Precio */}
                  <div className="flex flex-col gap-1 w-24 sm:w-28">
                    <Label htmlFor={`precio-${item.id}`} className="text-xs">
                      Precio Unit.
                    </Label>
                    <Input
                      id={`precio-${item.id}`}
                      type="text"
                      value={item.precioUnitario}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const nuevoPrecio = parseFloat(valor);
                        if (valor === "") {
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...i, precioUnitario: 0, subtotal: 0 } : i
                            )
                          );
                          return;
                        }
                        if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return;
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? { ...i, precioUnitario: nuevoPrecio, subtotal: i.cantidad * nuevoPrecio }
                              : i
                          )
                        );
                      }}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Subtotal */}
                  <span className="font-bold text-blue-600 min-w-[70px] text-right text-sm sm:text-base">
                    ${item.subtotal.toLocaleString()}
                  </span>

                  {/* Botón eliminar solo en desktop */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarItem(item.id)}
                    className="text-red-600 hover:text-red-700 hidden sm:flex"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totales */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${facturaActual.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA ({porcentajeIva}%)</span>
                <span>${facturaActual.iva.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-blue-600">
                <span>TOTAL (precio de lista)</span>
                <span>${Math.round(facturaActual.total).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Efectivo / transferencia (-{DISCOUNT_PERCENT_CASH}%):
                </span>
                <span className="font-bold text-blue-700">
                  ${Math.round(totalConDebitoEfectivo).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tarjeta (+{SURCHARGE_PERCENT_CARD}%):
                </span>
                <span className="font-bold text-violet-700">
                  ${Math.round(totalConTarjeta).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
