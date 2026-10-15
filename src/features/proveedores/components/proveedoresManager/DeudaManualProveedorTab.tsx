import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, DollarSign } from "lucide-react";

interface DeudaManualProveedorTabProps {
  montoDeuda: string;
  setMontoDeuda: (v: string) => void;
  conceptoDeuda: string;
  setConceptoDeuda: (v: string) => void;
  isLoading: boolean;
  onRegistrarDeuda: () => void;
}

export function DeudaManualProveedorTab({
  montoDeuda,
  setMontoDeuda,
  conceptoDeuda,
  setConceptoDeuda,
  isLoading,
  onRegistrarDeuda,
}: DeudaManualProveedorTabProps) {
  return (
    <>
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Agregar Deuda Manual
      </h3>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-bold">Monto</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-lg font-bold text-[hsl(var(--expense))]">$</span>
            <Input
              type="number"
              placeholder="0"
              value={montoDeuda}
              onChange={(e) => setMontoDeuda(e.target.value)}
              className="pl-8 text-lg font-bold"
              min="0"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold">Concepto</Label>
          <Input
            placeholder="Ej: Servicio, flete, descuento acordado..."
            value={conceptoDeuda}
            onChange={(e) => setConceptoDeuda(e.target.value)}
          />
        </div>

        <Button
          onClick={onRegistrarDeuda}
          disabled={isLoading || !montoDeuda || parseFloat(montoDeuda) <= 0}
          className="w-full"
        >
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? "Registrando..." : "Registrar Deuda"}
        </Button>
      </div>
    </>
  );
}
