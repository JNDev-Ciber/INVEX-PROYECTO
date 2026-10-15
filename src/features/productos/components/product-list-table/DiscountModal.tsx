

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

interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  selectedProductForDiscount: Product | null;
  setSelectedProductForDiscount: (product: Product | null) => void;
  discountPercentInput: string;
  setDiscountPercentInput: (value: string) => void;
  discountActiveInput: boolean;
  setDiscountActiveInput: (value: boolean) => void;
  isSavingDiscount: boolean;
  setIsSavingDiscount: (value: boolean) => void;
  handleSaveDiscount: () => Promise<void> | void;
  onDiscountSave: (
    productId: string,
    discountPercent: number,
    discountActive: boolean
  ) => Promise<boolean>;
}

export function DiscountModal({
  open,
  onOpenChange,
  selectedProductForDiscount,
  setSelectedProductForDiscount,
  discountPercentInput,
  setDiscountPercentInput,
  discountActiveInput,
  setDiscountActiveInput,
  isSavingDiscount,
  setIsSavingDiscount,
  handleSaveDiscount,
  onDiscountSave,
}: DiscountModalProps) {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>Descuento</DialogTitle>
          <DialogDescription>
            Configurá el descuento para {selectedProductForDiscount?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="discount-percent">Descuento (%)</Label>
            <Input
              id="discount-percent"
              inputMode="decimal"
              placeholder="10"
              value={discountPercentInput}
              onChange={(e) => setDiscountPercentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSaveDiscount();
              }}
              autoFocus
              className="dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="discount-active"
              type="checkbox"
              checked={discountActiveInput}
              onChange={(e) => setDiscountActiveInput(e.target.checked)}
            />
            <Label htmlFor="discount-active">Activo</Label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveDiscount}
              disabled={isSavingDiscount}
              className="flex-1"
            >
              {isSavingDiscount ? "Guardando..." : "Guardar"}
            </Button>

            {selectedProductForDiscount && (
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsSavingDiscount(true);
                  try {
                    await onDiscountSave(
                      selectedProductForDiscount.id,
                      0,
                      false
                    );
                    toast({
                      title: "Descuento quitado",
                      description: "El descuento fue eliminado.",
                      duration: 2000,
                    });
                    onOpenChange(false);
                    setSelectedProductForDiscount(null);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "No se pudo quitar el descuento",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSavingDiscount(false);
                  }
                }}
                disabled={isSavingDiscount}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Quitar
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
