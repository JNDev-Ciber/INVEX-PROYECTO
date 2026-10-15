import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  PedidoWeb,
  PedidoWebItem,
} from "@/mocks/pedidos-web";

interface EditarPedidoWebDialogProps {
  pedido: PedidoWeb | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, carrito: PedidoWebItem[]) => Promise<unknown>;
  isSaving: boolean;
}

export function EditarPedidoWebDialog({
  pedido,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: EditarPedidoWebDialogProps) {
  const [items, setItems] = useState<PedidoWebItem[]>([]);

  useEffect(() => {
    if (pedido) setItems(pedido.carrito.map((item) => ({ ...item })));
  }, [pedido]);

  const setCantidad = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    );
  };

  const quitarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const total = items.reduce(
    (sum, item) => sum + item.precio * item.quantity,
    0
  );

  const handleSave = async () => {
    if (!pedido) return;
    const carritoFinal = items.filter((item) => item.quantity > 0);
    await onSave(pedido.id, carritoFinal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar pedido</DialogTitle>
          <DialogDescription>
            Ajustá cantidades o sacá productos antes de aprobar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin productos. Agregá alguno o rechazá el pedido.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-muted/40 rounded"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {item.nombre}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${item.precio.toLocaleString()} c/u
                  </div>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) =>
                    setCantidad(item.id, Number(e.target.value))
                  }
                  className="w-16 h-8 text-center"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => quitarItem(item.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-semibold">Total:</span>
          <span className="font-bold text-lg">${total.toLocaleString()}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
