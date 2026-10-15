

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product, Movement, PriceHistory } from "@/shared/types/inventory";
import { ProductTableRow } from "./ProductTableRow";

interface ProductsTableProps {
  isDark: boolean;
  paginatedProducts: Product[];
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

export function ProductsTable({
  isDark,
  paginatedProducts,
  onEdit,
  onQuickStock,
  onOpenBarcodeDialog,
  onOpenDiscountDialog,
  onOpenQuickSalePaymentDialog,
  onDelete,
  onOpenHistory,
  getMovementsByProduct,
  getPriceHistoryByProduct,
}: ProductsTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700">
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                Producto
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                Categoría
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                Subcategoría
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                Código Barras
              </TableHead>
              <TableHead className="font-semibold text-right text-gray-700 dark:text-gray-200">
                Precio
              </TableHead>
              <TableHead className="font-semibold text-right text-gray-700 dark:text-gray-200">
                Costo
              </TableHead>
              <TableHead className="font-semibold text-right text-gray-700 dark:text-gray-200">
                Stock
              </TableHead>
              <TableHead className="font-semibold text-right text-gray-700 dark:text-gray-200">
                Margen
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                Estado
              </TableHead>
              <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                isDark={isDark}
                onEdit={onEdit}
                onQuickStock={onQuickStock}
                onOpenBarcodeDialog={onOpenBarcodeDialog}
                onOpenDiscountDialog={onOpenDiscountDialog}
                onOpenQuickSalePaymentDialog={onOpenQuickSalePaymentDialog}
                onDelete={onDelete}
                onOpenHistory={onOpenHistory}
                getMovementsByProduct={getMovementsByProduct}
                getPriceHistoryByProduct={getPriceHistoryByProduct}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
