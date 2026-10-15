import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PLAN_LABEL,
  type PlanTier,
} from "@/features/dashboard/sections/registry";

interface PlanBloqueadoProps {
  /** Plan mínimo que exige la sección. */
  requerido: PlanTier;
  /** Plan actual de la instancia (null si todavía no se resolvió). */
  actual: PlanTier | null;
  onVolver: () => void;
}

export function PlanBloqueado({ requerido, actual, onVolver }: PlanBloqueadoProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            Función del plan {PLAN_LABEL[requerido]}
          </h2>
          <p className="text-sm text-muted-foreground">
            Esta sección no está incluida en tu plan
            {actual ? ` (${PLAN_LABEL[actual]})` : ""}. Actualizá a{" "}
            <span className="font-medium text-foreground">
              {PLAN_LABEL[requerido]}
            </span>{" "}
            para habilitarla.
          </p>
        </div>
        <Button variant="outline" onClick={onVolver} className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    </div>
  );
}
