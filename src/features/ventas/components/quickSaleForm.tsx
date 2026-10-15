

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  X,
  CheckCircle,
  XCircle,
  Download,
  CreditCard,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import type { ClienteVenta, Product } from "@/shared/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { barcodeSchema } from "@/features/ventas/schemas/quick-sale.schema";
import { insertarBoletaPendiente } from "@/mocks/boletas";
import { ClienteSelector } from "@/features/clientes/components/ClienteSelector";

const titleWithIcon = (Icon: LucideIcon, text: string) => (
  <span className="flex items-center gap-2">
    <Icon className="h-4 w-4" />
    {text}
  </span>
);

interface QuickSaleItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface QuickSaleFormProps {
  products: Product[];
  onLookupProductByBarcode?: (barcode: string) => Promise<Product | undefined>;
  onSaleComplete: (
    items: QuickSaleItem[],
    metodoPago: "debito" | "credito",
    clienteId: number | null
  ) => Promise<void>;
  currentUser?: { id?: string | number; username: string; rol: string } | null;
}

export function QuickSaleForm({
  products,
  onLookupProductByBarcode,
  onSaleComplete,
  currentUser,
}: QuickSaleFormProps) {
  const { toast } = useToast();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cartItems, setCartItems] = useState<QuickSaleItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // Cliente opcional: con él, la compra queda en su ficha del CRM.
  const [cliente, setCliente] = useState<ClienteVenta | null>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBarcodeTimeRef = useRef<number>(0);

  const getEffectiveSalePrice = (product: Product) => {
    return Math.round(Number(product.price ?? 0));
  };

  const validateBarcode = (barcode: string): boolean => {
    const cleaned = barcode.trim().replace(/\s+/g, "");
    return barcodeSchema.safeParse({ barcode: cleaned }).success;
  };

  const findProductByBarcode = (barcode: string): Product | undefined => {
    const cleaned = barcode.trim().replace(/\s+/g, "");
    // Búsqueda exacta por código de barras.
    return products.find((p) => {
      const productBarcode = p.barcode ? p.barcode.trim().replace(/\s+/g, "") : "";
      return productBarcode === cleaned;
    });
  };

  useEffect(() => {
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current);
    }

    if (!barcodeInput.trim()) {
      return;
    }

    if (barcodeInput.length < 5) {
      return;
    }

    const now = Date.now();
    const timeSinceLastScan = now - lastBarcodeTimeRef.current;
    const delay = timeSinceLastScan < 100 ? 150 : 100;

    barcodeTimeoutRef.current = setTimeout(() => {
      const run = async () => {
        if (!validateBarcode(barcodeInput)) {
          toast({
            title: titleWithIcon(AlertTriangle, "Código inválido"),
            description: `"${barcodeInput}" no es válido`,
            variant: "destructive",
            duration: 800,
          });
          setBarcodeInput("");
          lastBarcodeTimeRef.current = Date.now();
          return;
        }

        let product = findProductByBarcode(barcodeInput);

        if (!product && onLookupProductByBarcode) {
          try {
            product = await onLookupProductByBarcode(barcodeInput);
          } catch {
            // Sin resultado: se trata abajo como "no encontrado".
          }
        }

        if (!product) {
          toast({
            title: titleWithIcon(XCircle, "No encontrado"),
            description: `${barcodeInput}`,
            variant: "destructive",
            duration: 800,
          });
          setBarcodeInput("");
          lastBarcodeTimeRef.current = Date.now();
          return;
        }

        if (product.quantity <= 0) {
          toast({
            title: titleWithIcon(XCircle, "Sin stock"),
            description: product.name,
            variant: "destructive",
            duration: 800,
          });
          setBarcodeInput("");
          lastBarcodeTimeRef.current = Date.now();
          return;
        }

        const resolvedProduct: Product = product;
        const effectiveUnitPrice = getEffectiveSalePrice(resolvedProduct);

        // ✅ Agregar al carrito
        setCartItems((prev) => {
          const existingItem = prev.find(
            (item) => item.product.id === resolvedProduct.id
          );

          if (existingItem) {
            if (existingItem.quantity >= resolvedProduct.quantity) {
              toast({
                title: titleWithIcon(AlertTriangle, "Stock limitado"),
                description: `Máx: ${resolvedProduct.quantity}`,
                duration: 800,
              });
              return prev;
            }
            return prev.map((item) =>
              item.product.id === resolvedProduct.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: (item.quantity + 1) * effectiveUnitPrice,
                  }
                : item
            );
          }

          return [
            ...prev,
            {
              product: resolvedProduct,
              quantity: 1,
              subtotal: effectiveUnitPrice,
            },
          ];
        });

        toast({
          title: <CheckCircle className="h-4 w-4" />,
          description: resolvedProduct.name,
          duration: 500,
        });

        setBarcodeInput("");
        lastBarcodeTimeRef.current = Date.now();
      };

      void run();
    }, delay);
  }, [barcodeInput, products, toast, onLookupProductByBarcode]);

  useEffect(() => {
    return () => {
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, []);

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  const handleChangeQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product || newQuantity > product.quantity) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * product.price,
            }
          : item
      )
    );
  };

  const DISCOUNT_PERCENT_CASH = 10;

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountedTotal = Math.round(total * (1 - DISCOUNT_PERCENT_CASH / 100));

  const buildDiscountedItems = () => {
    const factor = 1 - DISCOUNT_PERCENT_CASH / 100;
    return cartItems.map((item) => {
      const baseUnit = getEffectiveSalePrice(item.product);
      const discountedUnit = Math.round(baseUnit * factor);
      return {
        ...item,
        subtotal: discountedUnit * item.quantity,
      };
    });
  };

  const completeSale = async (
    items: QuickSaleItem[],
    title: ReactNode,
    description: string,
    metodoPago: "debito" | "credito"
  ) => {
    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      await onSaleComplete(items, metodoPago, cliente?.id ?? null);

      toast({
        title,
        description: cliente ? `${description} · ${cliente.nombre}` : description,
      });

      setCartItems([]);
      setCliente(null);
    } catch (error) {
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description: "No se pudo registrar",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteSaleCash = async () => {
    const items = buildDiscountedItems();
    await completeSale(
      items,
      titleWithIcon(CheckCircle, "Venta rápida registrada"),
      `Débito/Efectivo (-${DISCOUNT_PERCENT_CASH}%) · ${items.length} artículos`,
      "debito"
    );
  };

  const handleCompleteSaleNormal = async () => {
    await completeSale(
      cartItems,
      titleWithIcon(CheckCircle, "Venta registrada"),
      `${cartItems.length} artículos`,
      "credito"
    );
  };

  // Enviar a cola (boleta pendiente) para vendedor
  const enviarBoletaPendiente = async () => {
    if (!currentUser?.rol || currentUser.rol !== "vendedor") return;
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    try {
      const ventaPayload = {
        items: cartItems.map((it) => ({
          producto_id: it.product.id,
          nombre: it.product.name,
          cantidad: it.quantity,
          precioUnitario: it.product.price,
        })),
        subtotal: total,
        total: total,
      };
      await insertarBoletaPendiente({
        venta: ventaPayload,
        vendedorId: currentUser?.id,
        vendedorNombre: currentUser?.username,
        clienteId: cliente?.id ?? null,
      });

      toast({
        title: titleWithIcon(CheckCircle, "Boleta enviada"),
        description: "Se guardó correctamente en pendientes",
        duration: 2000,
      });

      // Limpiar carrito tras enviar a cola
      setCartItems([]);
      setCliente(null);
    } catch (error) {
      console.error("Error enviando boleta:", error);
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-[calc(100dvh-8rem)] overflow-hidden flex items-center justify-center p-2">
      <div className="w-full max-w-sm mx-auto h-full">
        <div className="flex flex-col gap-2 h-full justify-center min-h-0">
          <div className="p-2 border-2 border-primary/40 rounded-lg bg-primary/5">
            <Input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Escaneá código..."
              autoFocus
              className="text-base font-bold text-center border-0 bg-transparent text-primary placeholder:text-primary/40 focus-visible:ring-0"
            />
            <div className="text-xs text-primary/70 mt-2 text-center">
              Listo para escanear
            </div>
          </div>

          {cartItems.length === 0 ? (
            <Alert className="border-dashed border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-sm ml-2">
                Acercá el lector para empezar
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-xl overflow-hidden border bg-card flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1 p-2">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-lg flex items-center justify-between gap-3 transition-colors hover:bg-accent bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          $
                          {getEffectiveSalePrice(item.product).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold text-[hsl(var(--income))] tabular-nums">
                        ${item.subtotal.toLocaleString()}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t space-y-3 bg-muted/40">
                <ClienteSelector value={cliente} onChange={setCliente} disabled={isProcessing} />
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-2xl font-black text-[hsl(var(--income))] tabular-nums">
                    ${total.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentUser?.rol !== "vendedor" && (
                    <>
                      <Button
                        onClick={handleCompleteSaleCash}
                        disabled={isProcessing}
                        className="w-full py-3 px-3 rounded-lg bg-[hsl(var(--income))] hover:bg-[hsl(var(--income))]/90 text-[hsl(var(--income-foreground))]"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                            Procesando...
                          </>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <Banknote className="h-5 w-5 flex-shrink-0" />
                            <div className="flex flex-col text-left leading-tight min-w-0">
                              <span className="text-sm font-bold truncate">
                                Venta rápida
                              </span>
                              <span className="text-[11px] font-medium opacity-90 truncate">
                                Débito/Efectivo (-{DISCOUNT_PERCENT_CASH}%)
                              </span>
                            </div>
                          </div>
                        )}
                      </Button>

                      <Button
                        onClick={handleCompleteSaleNormal}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full py-3 px-3 rounded-lg"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                            Procesando...
                          </>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <CreditCard className="h-5 w-5 flex-shrink-0" />
                            <div className="flex flex-col text-left leading-tight min-w-0">
                              <span className="text-sm font-bold truncate">
                                Venta normal
                              </span>
                              <span className="text-[11px] font-medium text-muted-foreground truncate">
                                Tarjeta de crédito
                              </span>
                            </div>
                          </div>
                        )}
                      </Button>
                    </>
                  )}
                  {currentUser?.rol === "vendedor" && (
                    <Button
                      onClick={enviarBoletaPendiente}
                      disabled={isProcessing}
                      className="w-full py-3 px-3 rounded-lg"
                    >
                      <Banknote className="h-5 w-5 mr-2" />
                      Enviar a cola
                    </Button>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Total con descuento (Débito/Efectivo):
                  </span>
                  <span className="text-sm font-bold text-[hsl(var(--income))] tabular-nums">
                    ${discountedTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
