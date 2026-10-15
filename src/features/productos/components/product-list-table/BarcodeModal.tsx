

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { Product } from "@/shared/types/inventory";
import { useToast } from "@/hooks/use-toast";

interface BarcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  selectedProductForBarcode: Product | null;
  setSelectedProductForBarcode: (product: Product | null) => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  isSavingBarcode: boolean;
  setIsSavingBarcode: (value: boolean) => void;
  handleSaveBarcode: () => Promise<void> | void;
  onBarcodeSave: (productId: string, barcode: string) => Promise<boolean>;
}

export function BarcodeModal({
  open,
  onOpenChange,
  selectedProductForBarcode,
  setSelectedProductForBarcode,
  barcodeInput,
  setBarcodeInput,
  isSavingBarcode,
  setIsSavingBarcode,
  handleSaveBarcode,
  onBarcodeSave,
}: BarcodeModalProps) {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>
            {selectedProductForBarcode?.barcode
              ? "Editar Código de Barras"
              : "Agregar Código de Barras"}
          </DialogTitle>
          <DialogDescription>
            Escanea o ingresa el código de barras para{" "}
            {selectedProductForBarcode?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="barcode-input">Código de Barras</Label>
            <div className="flex gap-2">
              <Input
                id="barcode-input"
                placeholder="Escanea aquí..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSaveBarcode();
                }}
                autoFocus
                className="dark:bg-gray-800 dark:border-gray-700"
              />
              {/* BOTN PARA LIMPIAR EL INPUT */}
              {barcodeInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBarcodeInput("")}
                  className="hover:bg-red-100 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/30 dark:hover:text-red-300 dark:hover:border-red-600"
                  title="Limpiar campo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveBarcode}
              disabled={isSavingBarcode}
              className="flex-1"
            >
              {isSavingBarcode ? "Guardando..." : "Guardar"}
            </Button>

            {/* BOTN PARA ELIMINAR DE LA BASE DE DATOS */}
            {selectedProductForBarcode?.barcode && (
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsSavingBarcode(true);
                  try {
                    await onBarcodeSave(selectedProductForBarcode.id, "");
                    toast({
                      title: "Código eliminado",
                      description: "El código de barras ha sido eliminado.",
                      duration: 2000,
                    });
                    onOpenChange(false);
                    setBarcodeInput("");
                    setSelectedProductForBarcode(null);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "No se pudo eliminar el código",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSavingBarcode(false);
                  }
                }}
                disabled={isSavingBarcode}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
