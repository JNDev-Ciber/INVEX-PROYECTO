import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { Proveedor } from "@/shared/types/inventory";

interface DeleteProveedorModalProps {
  proveedorToDelete: Proveedor;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteProveedorModal({
  proveedorToDelete,
  isLoading,
  onCancel,
  onConfirm,
}: DeleteProveedorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Eliminar proveedor</h3>
            <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <p className="text-sm">
          ¿Eliminar a <span className="font-bold">{proveedorToDelete.nombre}</span>?
          {proveedorToDelete.saldoPendiente > 0 && (
            <span className="block mt-1 text-orange-600 font-semibold">
              Tiene deuda pendiente de ${proveedorToDelete.saldoPendiente.toLocaleString()}
            </span>
          )}
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
