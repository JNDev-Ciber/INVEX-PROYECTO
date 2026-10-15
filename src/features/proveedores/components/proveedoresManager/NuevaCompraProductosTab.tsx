import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Check, X, Package } from "lucide-react";
import type { Product } from "@/shared/types/inventory";
import type { ProductoCompra } from "@/mocks/compras-proveedor";

interface ItemCarrito extends ProductoCompra {
  productName: string;
}

interface NuevaCompraProductosTabProps {
  suggestedProducts: Product[];
  productSearchTerm: string;
  setProductSearchTerm: (v: string) => void;
  isLoading: boolean;
  onRegistrarCompra: (items: ProductoCompra[], concepto?: string) => Promise<void>;
}

export function NuevaCompraProductosTab({
  suggestedProducts,
  productSearchTerm,
  setProductSearchTerm,
  isLoading,
  onRegistrarCompra,
}: NuevaCompraProductosTabProps) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [concepto, setConcepto] = useState("");

  const agregarProducto = (product: Product) => {
    const exists = carrito.find((i) => i.producto_id === product.id);
    if (exists) {
      setCarrito(
        carrito.map((i) =>
          i.producto_id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          producto_id: product.id,
          nombre: product.name,
          productName: product.name,
          cantidad: 1,
          precio_unitario: product.cost || 0,
        },
      ]);
    }
    setProductSearchTerm("");
  };

  const actualizarPrecio = (productoId: string, precio: string) => {
    setCarrito(
      carrito.map((i) =>
        i.producto_id === productoId
          ? { ...i, precio_unitario: parseFloat(precio) || 0 }
          : i
      )
    );
  };

  const actualizarCantidad = (productoId: string, delta: number) => {
    setCarrito(
      carrito.map((i) =>
        i.producto_id === productoId
          ? { ...i, cantidad: Math.max(1, i.cantidad + delta) }
          : i
      )
    );
  };

  const quitarItem = (productoId: string) => {
    setCarrito(carrito.filter((i) => i.producto_id !== productoId));
  };

  const totalCompra = carrito.reduce(
    (t, i) => t + i.cantidad * i.precio_unitario,
    0
  );

  const handleRegistrar = async () => {
    if (carrito.length === 0) return;
    await onRegistrarCompra(
      carrito.map(({ producto_id, nombre, cantidad, precio_unitario }) => ({
        producto_id,
        nombre,
        cantidad,
        precio_unitario,
      })),
      concepto || undefined
    );
    setCarrito([]);
    setConcepto("");
  };

  return (
    <>
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Nueva Compra
      </h3>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Buscar producto..."
          value={productSearchTerm}
          onChange={(e) => setProductSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {productSearchTerm && suggestedProducts.length > 0 && (
        <div className="mb-3 max-h-40 overflow-y-auto bg-white rounded border">
          {suggestedProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => agregarProducto(p)}
              className="w-full p-2 hover:bg-orange-100 text-left border-b last:border-b-0 transition-colors"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Stock: {p.quantity}</p>
                </div>
                <p className="font-bold text-orange-600">
                  Costo: ${p.cost.toLocaleString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {carrito.length > 0 && (
        <div className="space-y-2 mb-3">
          {carrito.map((item) => (
            <div key={item.producto_id} className="flex gap-2 items-center bg-white p-2 rounded border">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.productName}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => actualizarCantidad(item.producto_id, -1)}>−</Button>
                <span className="w-6 text-center font-semibold text-sm">{item.cantidad}</span>
                <Button variant="ghost" size="sm" onClick={() => actualizarCantidad(item.producto_id, 1)}>+</Button>
              </div>

              <div className="relative w-28 shrink-0">
                <span className="absolute left-2 top-2 text-xs font-bold text-orange-600">$</span>
                <Input
                  type="number"
                  value={item.precio_unitario || ""}
                  onChange={(e) => actualizarPrecio(item.producto_id, e.target.value)}
                  className="pl-5 h-8 text-sm"
                  placeholder="Precio"
                  min="0"
                />
              </div>

              <Button variant="ghost" size="sm" onClick={() => quitarItem(item.producto_id)}>
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}

          <div className="bg-white p-3 rounded border-2 border-orange-400 flex justify-between items-center">
            <span className="font-bold">TOTAL COMPRA:</span>
            <span className="text-2xl font-bold text-orange-600">
              ${totalCompra.toLocaleString()}
            </span>
          </div>

          <div>
            <Label className="text-xs font-bold">Concepto (opcional)</Label>
            <Input
              placeholder="Ej: Reposición de stock, compra mensual..."
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </div>

          <Button onClick={handleRegistrar} disabled={isLoading} className="w-full">
            <Check className="h-4 w-4 mr-2" />
            {isLoading ? "Registrando..." : "Registrar Compra"}
          </Button>
        </div>
      )}
    </>
  );
}
