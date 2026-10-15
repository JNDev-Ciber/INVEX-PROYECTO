

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { ClienteVenta } from "@/shared/types/inventory";

interface DeleteClienteModalProps {
  clienteToDelete: ClienteVenta;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteClienteModal({
  clienteToDelete,
  isLoading,
  onCancel,
  onConfirm,
}: DeleteClienteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-0 shadow-2xl">
        {/* Header del modal */}
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-900">
              Eliminar Cliente
            </h3>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          <p className="text-base">
            ¿Estás seguro de eliminar a{" "}
            <span className="font-bold text-red-600">
              {clienteToDelete.nombre}
            </span>
            ?
          </p>

          {clienteToDelete.saldoPendiente > 0 && (
            <Alert className="bg-yellow-50 border-yellow-300">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Este cliente tiene una deuda de $
                {clienteToDelete.saldoPendiente.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. Se eliminarán todos los
            datos asociados al cliente.
          </p>
        </div>

        {/* Botones */}
        <div className="bg-muted border-t p-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
