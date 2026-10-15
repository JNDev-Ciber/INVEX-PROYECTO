

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Calendar as CalendarIcon, Loader2, Package, ShoppingCart, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Product } from "@/shared/types/inventory";

type MovementType = "entrada" | "salida";

export function MovementModal({
  open,
  onOpenChange,
  movementType,
  stockInputMode,
  setStockInputMode,
  connectionStatus,
  selectedProduct,
  movementError,
  movementQuantity,
  setMovementQuantity,
  movementUnitValue,
  setMovementUnitValue,
  useCustomReason,
  setUseCustomReason,
  movementReason,
  setMovementReason,
  customReason,
  setCustomReason,
  esOtroDia,
  setEsOtroDia,
  fechaOtroDia,
  setFechaOtroDia,
  predefinedReasons,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movementType: MovementType;
  stockInputMode: "sumar" | "total";
  setStockInputMode: (mode: "sumar" | "total") => void;
  connectionStatus: "connecting" | "connected" | "error" | "offline";
  selectedProduct: Product | null;
  movementError: string;
  movementQuantity: string;
  setMovementQuantity: (value: string) => void;
  movementUnitValue: string;
  setMovementUnitValue: (value: string) => void;
  useCustomReason: boolean;
  setUseCustomReason: (value: boolean) => void;
  movementReason: string;
  setMovementReason: (value: string) => void;
  customReason: string;
  setCustomReason: (value: string) => void;
  esOtroDia: boolean;
  setEsOtroDia: (value: boolean) => void;
  fechaOtroDia: string;
  setFechaOtroDia: (value: string) => void;
  predefinedReasons: Record<MovementType, string[]>;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const [fechaPickerOpen, setFechaPickerOpen] = useState(false);
  const fechaSeleccionada = fechaOtroDia
    ? new Date(`${fechaOtroDia}T12:00:00`)
    : undefined;
  const hoy = new Date();
  const haceUnMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {movementType === "entrada" ? (
              <ShoppingCart className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {movementType === "entrada" ? "Registrar Venta" : "Agregar Stock"}
            {connectionStatus === "offline" && (
              <Badge variant="outline" className="text-orange-600">
                Offline
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {connectionStatus === "offline" && (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Sin conexión a la base de datos. Los movimientos no se pueden registrar en modo offline.
              </AlertDescription>
            </Alert>
          )}

          {selectedProduct && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Stock actual:</span> {selectedProduct.quantity} unidades
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">{movementType === "entrada" ? "Precio:" : "Costo:"}</span> ${
                  (movementType === "entrada" ? selectedProduct.price : selectedProduct.cost).toLocaleString()
                }
              </p>
            </div>
          )}

          {movementError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{movementError}</AlertDescription>
            </Alert>
          )}

          {movementType === "salida" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="stockModeSumar"
                  checked={stockInputMode === "sumar"}
                  onChange={() => setStockInputMode("sumar")}
                  disabled={connectionStatus === "offline"}
                />
                <Label htmlFor="stockModeSumar" className="text-sm">
                  Sumar cantidad
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="stockModeTotal"
                  checked={stockInputMode === "total"}
                  onChange={() => setStockInputMode("total")}
                  disabled={connectionStatus === "offline"}
                />
                <Label htmlFor="stockModeTotal" className="text-sm">
                  Poner stock total
                </Label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="movementQuantity">
                {movementType === "salida" && stockInputMode === "total"
                  ? "Stock total nuevo *"
                  : "Cantidad *"}
              </Label>
              <Input
                id="movementQuantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={movementQuantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+$/.test(value)) {
                    setMovementQuantity(value);
                  }
                }}
                placeholder="1"
                disabled={connectionStatus === "offline"}
                className="h-10"
              />
              {movementType === "entrada" && selectedProduct && (
                <p className="text-xs text-muted-foreground">Máximo disponible: {selectedProduct.quantity} unidades</p>
              )}
              {movementType === "salida" && stockInputMode === "total" && selectedProduct && movementQuantity !== "" && (
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const delta = Number(movementQuantity) - selectedProduct.quantity;
                    if (delta === 0) return "Sin cambios";
                    return delta > 0
                      ? `Se van a sumar ${delta} unidades`
                      : `Se van a restar ${Math.abs(delta)} unidades`;
                  })()}
                </p>
              )}
            </div>

            {(movementType === "salida" || movementType === "entrada") && (
              <div className="space-y-2">
                <Label htmlFor="movementUnitValue">
                  {movementType === "entrada" ? "Precio unitario" : "Costo unitario"}
                </Label>
                <Input
                  id="movementUnitValue"
                  type="text"
                  inputMode="decimal"
                  value={movementUnitValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
                      setMovementUnitValue(value);
                    }
                  }}
                  placeholder="0.00"
                  disabled={connectionStatus === "offline"}
                  className="h-10"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor Total</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                <span className="font-medium text-green-600 text-sm">
                  ${
                    (
                      (movementType === "entrada"
                        ? Number(movementUnitValue || selectedProduct?.price || 0)
                        : Number(movementUnitValue || 0)) *
                      (movementType === "salida" && stockInputMode === "total" && selectedProduct
                        ? Math.abs(Number(movementQuantity || 0) - selectedProduct.quantity)
                        : Number(movementQuantity || 0))
                    ).toLocaleString()
                  }
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">Motivo del movimiento *</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="predefined"
                    checked={!useCustomReason}
                    onChange={() => setUseCustomReason(false)}
                    disabled={connectionStatus === "offline"}
                  />
                  <Label htmlFor="predefined" className="text-sm">
                    Seleccionar
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="custom"
                    checked={useCustomReason}
                    onChange={() => setUseCustomReason(true)}
                    disabled={connectionStatus === "offline"}
                  />
                  <Label htmlFor="custom" className="text-sm">
                    Escribir
                  </Label>
                </div>
              </div>
            </div>

            {!useCustomReason ? (
              <div className="space-y-2">
                <Select value={movementReason} onValueChange={setMovementReason} disabled={connectionStatus === "offline"}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecciona un motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedReasons[movementType].map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe el motivo específico del movimiento..."
                  rows={3}
                  disabled={connectionStatus === "offline"}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {(movementType === "entrada" ||
            (movementType === "salida" && stockInputMode === "sumar")) && (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="esOtroDia"
                  checked={esOtroDia}
                  onChange={(e) => setEsOtroDia(e.target.checked)}
                  disabled={connectionStatus === "offline"}
                />
                <Label htmlFor="esOtroDia" className="text-sm">
                  ¿Fue de otro día? (venta o reposición olvidada)
                </Label>
              </div>
              {esOtroDia && (
                <div className="space-y-1">
                  <Label className="text-xs">¿Qué día pasó?</Label>
                  <Popover open={fechaPickerOpen} onOpenChange={setFechaPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={connectionStatus === "offline"}
                        className={`w-full justify-start text-left font-normal h-10 ${
                          !fechaSeleccionada ? "text-muted-foreground" : ""
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaSeleccionada ? (
                          format(fechaSeleccionada, "PPP", { locale: es })
                        ) : (
                          <span>Elegí la fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={fechaSeleccionada}
                        onSelect={(date) => {
                          if (date) {
                            setFechaOtroDia(format(date, "yyyy-MM-dd"));
                          }
                          setFechaPickerOpen(false);
                        }}
                        disabled={(date) => date > hoy || date < haceUnMes}
                        locale={es}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    El stock se actualiza ahora igual, solo cambia la fecha con
                    la que queda anotado (hasta 30 días atrás).
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={onSubmit}
              disabled={
                isSubmitting ||
                connectionStatus === "offline" ||
                (!useCustomReason && !movementReason.trim()) ||
                (useCustomReason && !customReason.trim()) ||
                !movementQuantity ||
                (movementType === "salida" && stockInputMode === "total"
                  ? Number(movementQuantity) < 0
                  : Number(movementQuantity) <= 0) ||
                (esOtroDia && !fechaOtroDia)
              }
              className="w-full h-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {movementType === "entrada" ? (
                    <ShoppingCart className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  {movementType === "entrada" ? "Registrar Venta" : "Agregar Stock"}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="w-full h-10">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
