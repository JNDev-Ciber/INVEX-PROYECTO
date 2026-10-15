import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Check, DollarSign } from "lucide-react";
import type { Proveedor } from "@/shared/types/inventory";

interface ProveedorDeudaSidebarProps {
  selectedProveedor: Proveedor;
  montoPago: string;
  setMontoPago: (v: string) => void;
  isLoading: boolean;
  onPago: () => void;
}

export function ProveedorDeudaSidebar({
  selectedProveedor,
  montoPago,
  setMontoPago,
  isLoading,
  onPago,
}: ProveedorDeudaSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <Card className="p-4">
        <div className="space-y-3">
          {selectedProveedor.telefono && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">Teléfono</p>
              <p className="font-semibold">{selectedProveedor.telefono}</p>
            </div>
          )}
          {selectedProveedor.cuit && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">CUIT</p>
              <p className="font-semibold">{selectedProveedor.cuit}</p>
            </div>
          )}
          {selectedProveedor.email && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">Email</p>
              <p className="font-semibold text-sm">{selectedProveedor.email}</p>
            </div>
          )}
          {selectedProveedor.direccion && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">Dirección</p>
              <p className="font-semibold text-sm">{selectedProveedor.direccion}</p>
            </div>
          )}
        </div>
      </Card>

      {selectedProveedor.saldoPendiente > 0 ? (
        <div className="space-y-3">
          <Alert className="bg-orange-50 border-orange-300">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <div className="text-xs font-medium">LO QUE DEBEMOS</div>
              <div className="text-2xl font-bold">
                ${selectedProveedor.saldoPendiente.toLocaleString()}
              </div>
            </AlertDescription>
          </Alert>

          <Card className="p-3 bg-white border-2 border-orange-300">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-orange-900">REGISTRAR PAGO</Label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-orange-600">$</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  className="pl-7 font-bold text-lg"
                  min="0"
                  max={selectedProveedor.saldoPendiente}
                />
              </div>

              {montoPago && parseFloat(montoPago) > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deuda actual:</span>
                    <span className="font-semibold">
                      ${selectedProveedor.saldoPendiente.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pago:</span>
                    <span className="font-semibold text-green-600">
                      -${parseFloat(montoPago).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t mt-1 pt-1">
                    <span>Nueva deuda:</span>
                    <span
                      className={
                        selectedProveedor.saldoPendiente - parseFloat(montoPago) > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }
                    >
                      $
                      {Math.max(
                        0,
                        selectedProveedor.saldoPendiente - parseFloat(montoPago)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={onPago}
                disabled={
                  isLoading ||
                  !montoPago ||
                  parseFloat(montoPago) <= 0 ||
                  parseFloat(montoPago) > selectedProveedor.saldoPendiente
                }
                className="w-full"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Pago
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Alert className="bg-green-50 border-green-300">
          <Check className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="text-sm font-semibold">Sin deudas pendientes</div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
