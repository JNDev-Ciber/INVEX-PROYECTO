

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  ShoppingCart,
  Package,
  History,
  TrendingUp,
  Tag,
  Barcode,
  AlertCircle,
  Check,
  Trash2,
} from "lucide-react";
import type { Product, Movement, PriceHistory } from "@/shared/types/inventory";
import {
  formatCurrency,
  getMarginColor,
  getStockStatus,
} from "./helpers";

interface ProductCardProps {
  product: Product;
  isDark: boolean;
  onEdit: (product: Product) => void;
  onQuickSale: (product: Product, paymentType?: "cash" | "credit") => void;
  onQuickStock: (product: Product) => void;
  onOpenBarcodeDialog: (product: Product) => void;
  onOpenDiscountDialog: (product: Product) => void;
  onDelete: (product: Product) => void;
  onOpenHistory: (product: Product) => void;
  getMovementsByProduct: (productId: string) => Movement[];
  getPriceHistoryByProduct: (productId: string) => PriceHistory[];
}

export function ProductCard({
  product,
  onEdit,
  onQuickSale,
  onQuickStock,
  onOpenBarcodeDialog,
  onOpenDiscountDialog,
  onDelete,
  onOpenHistory,
  getMovementsByProduct,
  getPriceHistoryByProduct,
}: ProductCardProps) {
  const stockStatus = getStockStatus(product);
  const margin =
    product.price > 0
      ? ((product.price - product.cost) / product.price) * 100
      : 0;
  const movements = getMovementsByProduct(product.id);
  const priceHistory = getPriceHistoryByProduct(product.id);
  const hasBarcode = product.barcode && product.barcode.trim() !== "";
  const discountPercent =
    product.discountPercent != null ? Number(product.discountPercent) : 0;
  const hasDiscount =
    (product.originalPrice != null && product.originalPrice > product.price) ||
    (Boolean(product.discountActive) && discountPercent > 0);
  const discountPercentForDisplay =
    product.originalPrice != null && product.originalPrice > product.price
      ? Math.round(100 - (product.price / product.originalPrice) * 100)
      : discountPercent;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground truncate">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">{product.code}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              {product.subcategory && (
                <Badge variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {product.subcategory}
                </Badge>
              )}
              {hasDiscount && (
                <Badge variant="destructive" className="text-xs">
                  -{discountPercentForDisplay}%
                </Badge>
              )}
            </div>
          </div>
          <Badge variant={stockStatus.variant} className="text-xs shrink-0">
            <stockStatus.icon className="w-3 h-3 mr-1" />
            {stockStatus.label}
          </Badge>
        </div>

        {hasBarcode ? (
          <div className="mb-3 p-2 rounded-md flex items-center gap-2 bg-[hsl(var(--income))]/10">
            <Check className="w-4 h-4 text-[hsl(var(--income))]" />
            <span className="text-xs font-mono text-[hsl(var(--income))]">
              {product.barcode}
            </span>
          </div>
        ) : (
          <div className="mb-3 p-2 rounded-md flex items-center gap-2 bg-amber-500/10">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Sin código de barras
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground/70">Precio</p>
            <p className="font-semibold text-[hsl(var(--income))] tabular-nums">
              {formatCurrency(product.price)}
            </p>
            {hasDiscount && product.originalPrice != null && (
              <p className="text-xs line-through text-muted-foreground/70 tabular-nums">
                {formatCurrency(product.originalPrice)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70">Stock</p>
            <p className={`font-semibold tabular-nums ${stockStatus.color}`}>
              {product.quantity}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70">Costo</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(product.cost)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70">Margen</p>
            <p className={`font-semibold tabular-nums ${getMarginColor(margin)}`}>
              {margin.toFixed(1)}%
            </p>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickSale(product)}
            disabled={product.quantity <= 0}
            className="flex-1 hover:bg-[hsl(var(--income))]/10 hover:text-[hsl(var(--income))] hover:border-[hsl(var(--income))]/40"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vender
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickStock(product)}
            className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
          >
            <Package className="h-4 w-4 mr-2" />
            Stock
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenBarcodeDialog(product)}
            title="Agregar código de barras"
          >
            <Barcode className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar producto
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onOpenDiscountDialog(product)}>
                <Tag className="h-4 w-4 mr-2" />
                Descuento...
              </DropdownMenuItem>

              {movements.length > 0 && (
                <DropdownMenuItem onClick={() => onOpenHistory(product)}>
                  <History className="h-4 w-4 mr-2" />
                  Historial ({movements.length})
                </DropdownMenuItem>
              )}

              {priceHistory.length > 0 && (
                <DropdownMenuItem>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Precios ({priceHistory.length})
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(product)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar producto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
