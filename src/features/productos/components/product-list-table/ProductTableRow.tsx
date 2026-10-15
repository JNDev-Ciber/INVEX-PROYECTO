

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Check,
  Trash2,
} from "lucide-react";
import type { Product, Movement, PriceHistory } from "@/shared/types/inventory";
import {
  formatCurrency,
  getMarginColor,
  getStockStatus,
} from "./helpers";

interface ProductTableRowProps {
  product: Product;
  isDark: boolean;
  onEdit: (product: Product) => void;
  onQuickStock: (product: Product) => void;
  onOpenBarcodeDialog: (product: Product) => void;
  onOpenDiscountDialog: (product: Product) => void;
  onOpenQuickSalePaymentDialog: (product: Product) => void;
  onDelete: (product: Product) => void;
  onOpenHistory: (product: Product) => void;
  getMovementsByProduct: (productId: string) => Movement[];
  getPriceHistoryByProduct: (productId: string) => PriceHistory[];
}

export function ProductTableRow({
  product,
  onEdit,
  onQuickStock,
  onOpenBarcodeDialog,
  onOpenDiscountDialog,
  onOpenQuickSalePaymentDialog,
  onDelete,
  onOpenHistory,
  getMovementsByProduct,
  getPriceHistoryByProduct,
}: ProductTableRowProps) {
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
    (product.originalPrice != null &&
      product.originalPrice > product.price) ||
    (Boolean(product.discountActive) && discountPercent > 0);
  const discountPercentForDisplay =
    product.originalPrice != null && product.originalPrice > product.price
      ? Math.round(100 - (product.price / product.originalPrice) * 100)
      : discountPercent;

  const quantityColor =
    product.quantity <= 0
      ? "text-destructive"
      : product.quantity <= product.minStock
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";

  return (
    <TableRow key={product.id} className="transition-colors">
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium text-foreground">{product.name}</div>
          <div className="text-sm text-muted-foreground">{product.code}</div>
          {product.description && (
            <div className="text-xs text-muted-foreground/70 max-w-xs truncate">
              {product.description}
            </div>
          )}
          {hasDiscount && (
            <div>
              <Badge variant="destructive" className="text-xs">
                -{discountPercentForDisplay}%
              </Badge>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className="text-xs">
          {product.category}
        </Badge>
      </TableCell>

      <TableCell>
        {product.subcategory ? (
          <Badge variant="secondary" className="text-xs">
            <Tag className="w-3 h-3 mr-1" />
            {product.subcategory}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/70">
            Sin subcategoría
          </span>
        )}
      </TableCell>

      <TableCell>
        {hasBarcode ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenBarcodeDialog(product)}
            className="font-mono text-xs hover:bg-[hsl(var(--income))]/10 hover:text-[hsl(var(--income))]"
            title="Editar código de barras"
          >
            <Check className="w-3 h-3 mr-1" />
            {product.barcode}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenBarcodeDialog(product)}
            className="text-xs"
            title="Agregar código de barras"
          >
            <Barcode className="w-3 h-3 mr-1" />
            Agregar
          </Button>
        )}
      </TableCell>

      <TableCell className="text-right">
        <div className="font-medium text-[hsl(var(--income))] tabular-nums">
          {formatCurrency(product.price)}
        </div>
        {hasDiscount && product.originalPrice != null && (
          <div className="text-xs line-through text-muted-foreground/70 tabular-nums">
            {formatCurrency(product.originalPrice)}
          </div>
        )}
      </TableCell>

      <TableCell className="text-right">
        <div className="text-sm text-muted-foreground tabular-nums">
          {formatCurrency(product.cost)}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className="space-y-1">
          <div className={`font-medium tabular-nums ${quantityColor}`}>
            {product.quantity}
          </div>
          <div className="text-xs text-muted-foreground/70">
            Mín: {product.minStock}
          </div>
          {product.totalQuantity != null && product.totalQuantity !== product.quantity && (
            <div
              className="text-xs text-muted-foreground/70"
              title="Stock sumando todas las sucursales"
            >
              Total: {product.totalQuantity}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className={`font-medium tabular-nums ${getMarginColor(margin)}`}>
          {margin.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground/70 tabular-nums">
          {formatCurrency(product.price - product.cost)}
        </div>
      </TableCell>

      <TableCell>
        <Badge variant={stockStatus.variant} className="text-xs">
          <stockStatus.icon className="w-3 h-3 mr-1" />
          {stockStatus.label}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenQuickSalePaymentDialog(product)}
            disabled={product.quantity <= 0}
            className="h-8 w-8 p-0 hover:bg-[hsl(var(--income))]/10 hover:text-[hsl(var(--income))]"
            title="Venta rápida"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuickStock(product)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Agregar stock"
          >
            <Package className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
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
      </TableCell>
    </TableRow>
  );
}
