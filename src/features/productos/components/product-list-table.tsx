

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/shared/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Banknote,
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Product, Movement, PriceHistory } from "@/shared/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "./product-list-table/ProductCard";
import { ProductsTable } from "./product-list-table/ProductsTable";
import { ProductFilters } from "./product-list-table/ProductFilters";
import { BarcodeModal } from "./product-list-table/BarcodeModal";
import { DiscountModal } from "./product-list-table/DiscountModal";
import { formatCurrency, normalizeText } from "./product-list-table/helpers";
import { formatFechaLocal } from "@/shared/lib/date";

interface ProductListTableProps {
  products: Product[];
  categories?: string[];
  productsHasMore: boolean;
  productsLoadingMore: boolean;
  onLoadMoreProducts: () => Promise<boolean>;
  onSearchProductsPage: (
    query: string,
    limit: number,
    offset: number,
    excludeOutOfStock: boolean
  ) => Promise<{ items: Product[]; hasMore: boolean }>;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => Promise<boolean>;
  onQuickSale: (product: Product, paymentType?: "cash" | "credit") => void;
  onQuickStock: (product: Product) => void;
  onBarcodeSave: (productId: string, barcode: string) => Promise<boolean>;
  onDiscountSave: (
    productId: string,
    discountPercent: number,
    discountActive: boolean
  ) => Promise<boolean>;
  getMovementsByProduct: (productId: string) => Movement[];
  getPriceHistoryByProduct: (productId: string) => PriceHistory[];
}

export function ProductListTable({
  products,
  categories: categoriesProp = [],
  productsHasMore,
  productsLoadingMore,
  onLoadMoreProducts,
  onSearchProductsPage,
  onEdit,
  onDelete,
  onQuickSale,
  onQuickStock,
  onBarcodeSave,
  onDiscountSave,
  getMovementsByProduct,
  getPriceHistoryByProduct,
}: ProductListTableProps) {
  const { theme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isMobile, setIsMobile] = useState(false);
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] =
    useState<Product | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isSavingBarcode, setIsSavingBarcode] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] =
    useState<Product | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState("10");
  const [discountActiveInput, setDiscountActiveInput] = useState(true);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [serverSearchItems, setServerSearchItems] = useState<Product[]>([]);
  const [serverSearchHasMore, setServerSearchHasMore] = useState(false);
  const [serverSearchLoading, setServerSearchLoading] = useState(false);

  const [quickSalePaymentDialogOpen, setQuickSalePaymentDialogOpen] = useState(false);
  const [selectedProductForQuickSale, setSelectedProductForQuickSale] =
    useState<Product | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProductForDelete, setSelectedProductForDelete] =
    useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] =
    useState<Product | null>(null);

  const handleOpenQuickSalePaymentDialog = (product: Product) => {
    setSelectedProductForQuickSale(product);
    setQuickSalePaymentDialogOpen(true);
  };

  const handleConfirmQuickSale = (paymentType: "cash" | "credit") => {
    if (!selectedProductForQuickSale) return;
    onQuickSale(selectedProductForQuickSale, paymentType);
    setQuickSalePaymentDialogOpen(false);
    setSelectedProductForQuickSale(null);
  };

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode("grid");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Resetear página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchTerm]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const normalizedSearchTerm = useMemo(
    () => normalizeText(searchTerm),
    [searchTerm]
  );

  useEffect(() => {
    let canceled = false;

    const run = async () => {
      if (!normalizedSearchTerm) {
        setServerSearchItems([]);
        setServerSearchHasMore(false);
        setServerSearchLoading(false);
        return;
      }

      setServerSearchLoading(true);
      try {
        const res = await onSearchProductsPage(
          normalizedSearchTerm,
          200,
          0,
          false
        );
        if (canceled) return;
        setServerSearchItems(res.items);
        setServerSearchHasMore(res.hasMore);
      } catch (e) {
        if (canceled) return;
        setServerSearchItems([]);
        setServerSearchHasMore(false);
      } finally {
        if (canceled) return;
        setServerSearchLoading(false);
      }
    };

    const t = setTimeout(() => {
      void run();
    }, 250);

    return () => {
      canceled = true;
      clearTimeout(t);
    };
  }, [normalizedSearchTerm, onSearchProductsPage]);

  const baseProductsForView = normalizedSearchTerm ? serverSearchItems : products;

  // MEMORIZAR CÁLCULOS
  const categories = useMemo(() => {
    if (categoriesProp.length > 0) return categoriesProp;
    return [...new Set(baseProductsForView.map((p) => p.category))];
  }, [baseProductsForView, categoriesProp]);

  const allSubcategories = useMemo(
    () => [
      ...new Set(baseProductsForView.map((p) => p.subcategory).filter(Boolean)),
    ],
    [baseProductsForView]
  );

  const filteredSubcategories = useMemo(
    () =>
      selectedCategory === "all"
        ? allSubcategories
        : [
            ...new Set(
              baseProductsForView
                .filter((p) => p.category === selectedCategory)
                .map((p) => p.subcategory)
                .filter(Boolean)
            ),
          ],
    [selectedCategory, allSubcategories, baseProductsForView]
  );

  const filteredProducts = useMemo(
    () =>
      [...baseProductsForView]
        .filter((product) => {
          const matchesSearch =
            !normalizedSearchTerm ||
            normalizeText(product.name).includes(normalizedSearchTerm) ||
            normalizeText(product.code).includes(normalizedSearchTerm) ||
            normalizeText(product.category).includes(normalizedSearchTerm) ||
            normalizeText(product.subcategory || "").includes(
              normalizedSearchTerm
            );

          const matchesCategory =
            selectedCategory === "all" || product.category === selectedCategory;
          const matchesSubcategory =
            selectedSubcategory === "all" ||
            product.subcategory === selectedSubcategory;

          return matchesSearch && matchesCategory && matchesSubcategory;
        })
        .sort((a, b) => {
          const aInStock = a.quantity > 0;
          const bInStock = b.quantity > 0;
          if (aInStock !== bInStock) return aInStock ? -1 : 1;

          const byName = a.name.localeCompare(b.name, "es", {
            sensitivity: "base",
          });
          if (byName !== 0) return byName;

          return a.code.localeCompare(b.code, "es", { sensitivity: "base" });
        }),
    [
      baseProductsForView,
      normalizedSearchTerm,
      selectedCategory,
      selectedSubcategory,
    ]
  );

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleNextPage = async () => {
    if (currentPage >= totalPages) {
      if (!productsHasMore) return;
      if (productsLoadingMore) return;

      await onLoadMoreProducts();
      setCurrentPage((prev) => prev + 1);
      return;
    }

    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleOpenBarcodeDialog = (product: Product) => {
    setSelectedProductForBarcode(product);
    setBarcodeInput("");
    setBarcodeDialogOpen(true);
  };

  const handleOpenHistoryDialog = (product: Product) => {
    setSelectedProductForHistory(product);
    setHistoryDialogOpen(true);
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setSelectedProductForDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProductForDelete) return;
    setIsDeleting(true);
    try {
      const ok = await onDelete(selectedProductForDelete.id);
      if (ok) {
        setDeleteDialogOpen(false);
        setSelectedProductForDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDiscountDialog = (product: Product) => {
    setSelectedProductForDiscount(product);
    const existingPercent =
      product.discountPercent != null ? Number(product.discountPercent) : 0;
    const existingActive =
      Boolean(product.discountActive) && existingPercent > 0;

    setDiscountPercentInput(String(existingPercent > 0 ? existingPercent : 10));
    setDiscountActiveInput(existingActive || existingPercent === 0);
    setDiscountDialogOpen(true);
  };

  const handleSaveBarcode = async () => {
    if (!selectedProductForBarcode) return;

    // Permitir guardar vacío para eliminar
    const cleanedBarcode = barcodeInput.trim();

    // Solo validar formato si hay contenido
    if (cleanedBarcode && !/^\d{5,}$/.test(cleanedBarcode)) {
      toast({
        title: "Código inválido",
        description: "Solo números, mínimo 5 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBarcode(true);
    try {
      await onBarcodeSave(selectedProductForBarcode.id, cleanedBarcode);

      toast({
        title: cleanedBarcode ? "Código guardado" : "Código eliminado",
        description: cleanedBarcode || "El código de barras fue eliminado",
        duration: 2000,
      });

      setBarcodeDialogOpen(false);
      setBarcodeInput("");
      setSelectedProductForBarcode(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el código",
        variant: "destructive",
      });
    } finally {
      setIsSavingBarcode(false);
    }
  };

  const handleSaveDiscount = async () => {
    if (!selectedProductForDiscount) return;

    const raw = String(discountPercentInput || "")
      .trim()
      .replace(",", ".");
    const parsed = Number(raw);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast({
        title: "Descuento inválido",
        description: "Ingresá un porcentaje entre 0 y 100",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDiscount(true);
    try {
      await onDiscountSave(
        selectedProductForDiscount.id,
        parsed,
        Boolean(discountActiveInput) && parsed > 0
      );

      toast({
        title: "Descuento guardado",
        description:
          Boolean(discountActiveInput) && parsed > 0
            ? `-${parsed}% aplicado`
            : "Descuento desactivado",
        duration: 2000,
      });

      setDiscountDialogOpen(false);
      setSelectedProductForDiscount(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el descuento",
        variant: "destructive",
      });
    } finally {
      setIsSavingDiscount(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground text-center">
            Comienza agregando tu primer producto al inventario.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Dialog
        open={quickSalePaymentDialogOpen}
        onOpenChange={(open) => {
          setQuickSalePaymentDialogOpen(open);
          if (!open) setSelectedProductForQuickSale(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar venta</DialogTitle>
            <DialogDescription>
              {selectedProductForQuickSale
                ? selectedProductForQuickSale.name
                : "Seleccioná el tipo de venta"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => handleConfirmQuickSale("cash")}
              disabled={!selectedProductForQuickSale}
              className="bg-green-600 hover:bg-green-700 px-4 py-3"
            >
              <div className="flex items-center gap-2 w-full">
                <Banknote className="h-5 w-5 flex-shrink-0" />
                <div className="flex flex-col text-left leading-tight min-w-0">
                  <span className="text-sm font-bold truncate">Débito/Efectivo</span>
                  <span className="text-[11px] font-medium text-white/90 truncate">-10%</span>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleConfirmQuickSale("credit")}
              disabled={!selectedProductForQuickSale}
              variant="outline"
              className="px-4 py-3"
            >
              <div className="flex items-center gap-2 w-full">
                <CreditCard className="h-5 w-5 flex-shrink-0" />
                <div className="flex flex-col text-left leading-tight min-w-0">
                  <span className="text-sm font-bold truncate">Crédito</span>
                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                    Venta normal
                  </span>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProductFilters
        isDark={isDark}
        isMobile={isMobile}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectedCategoryChange={setSelectedCategory}
        filteredSubcategories={filteredSubcategories}
        selectedSubcategory={selectedSubcategory}
        onSelectedSubcategoryChange={setSelectedSubcategory}
        onClearFilters={() => {
          setSelectedCategory("all");
          setSelectedSubcategory("all");
        }}
        filteredProducts={filteredProducts}
      />

      {viewMode === "grid" || isMobile ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isDark={isDark}
              onEdit={onEdit}
              onQuickSale={onQuickSale}
              onQuickStock={onQuickStock}
              onOpenBarcodeDialog={handleOpenBarcodeDialog}
              onOpenDiscountDialog={handleOpenDiscountDialog}
              onDelete={handleOpenDeleteDialog}
              onOpenHistory={handleOpenHistoryDialog}
              getMovementsByProduct={getMovementsByProduct}
              getPriceHistoryByProduct={getPriceHistoryByProduct}
            />
          ))}
        </div>
      ) : (
        <ProductsTable
          isDark={isDark}
          paginatedProducts={paginatedProducts}
          onEdit={onEdit}
          onQuickStock={onQuickStock}
          onOpenBarcodeDialog={handleOpenBarcodeDialog}
          onOpenDiscountDialog={handleOpenDiscountDialog}
          onOpenQuickSalePaymentDialog={handleOpenQuickSalePaymentDialog}
          onDelete={handleOpenDeleteDialog}
          onOpenHistory={handleOpenHistoryDialog}
          getMovementsByProduct={getMovementsByProduct}
          getPriceHistoryByProduct={getPriceHistoryByProduct}
        />
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages} ({filteredProducts.length}{" "}
            productos)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage > 3 ? currentPage - 2 + i : i + 1;
                if (page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={
                (currentPage === totalPages && !productsHasMore) ||
                productsLoadingMore
              }
              className="flex items-center gap-1"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* DIALOG GLOBAL PARA CÓDIGO DE BARRAS */}
      <BarcodeModal
        open={barcodeDialogOpen}
        onOpenChange={setBarcodeDialogOpen}
        isDark={isDark}
        selectedProductForBarcode={selectedProductForBarcode}
        setSelectedProductForBarcode={setSelectedProductForBarcode}
        barcodeInput={barcodeInput}
        setBarcodeInput={setBarcodeInput}
        isSavingBarcode={isSavingBarcode}
        setIsSavingBarcode={setIsSavingBarcode}
        handleSaveBarcode={handleSaveBarcode}
        onBarcodeSave={onBarcodeSave}
      />

      {/* DIALOG GLOBAL PARA DESCUENTO */}
      <DiscountModal
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        isDark={isDark}
        selectedProductForDiscount={selectedProductForDiscount}
        setSelectedProductForDiscount={setSelectedProductForDiscount}
        discountPercentInput={discountPercentInput}
        setDiscountPercentInput={setDiscountPercentInput}
        discountActiveInput={discountActiveInput}
        setDiscountActiveInput={setDiscountActiveInput}
        isSavingDiscount={isSavingDiscount}
        setIsSavingDiscount={setIsSavingDiscount}
        handleSaveDiscount={handleSaveDiscount}
        onDiscountSave={onDiscountSave}
      />

      {/* DIALOG GLOBAL PARA ELIMINAR PRODUCTO */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setSelectedProductForDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedProductForDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto y su
              historial asociado del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG GLOBAL PARA HISTORIAL DE MOVIMIENTOS */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Historial de {selectedProductForHistory?.name}
            </DialogTitle>
            <DialogDescription>
              Movimientos de stock registrados para este producto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedProductForHistory &&
              getMovementsByProduct(selectedProductForHistory.id).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={m.type === "entrada" ? "default" : "secondary"}
                        className={
                          m.type === "entrada"
                            ? "bg-[hsl(var(--income))]/15 text-[hsl(var(--income))]"
                            : "bg-destructive/15 text-destructive"
                        }
                      >
                        {m.type === "entrada" ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {m.type === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFechaLocal(m.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {m.reason}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={`font-medium tabular-nums ${
                        m.type === "entrada"
                          ? "text-[hsl(var(--income))]"
                          : "text-destructive"
                      }`}
                    >
                      {m.type === "entrada" ? "-" : "+"}
                      {m.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {m.previousQuantity} → {m.newQuantity}
                    </p>
                  </div>
                </div>
              ))}
            {selectedProductForHistory &&
              getMovementsByProduct(selectedProductForHistory.id).length ===
                0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sin movimientos registrados
                </p>
              )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-muted-foreground">
        <div>
          Mostrando {paginatedProducts.length} de {filteredProducts.length}{" "}
          productos
          {(selectedCategory !== "all" || selectedSubcategory !== "all") && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              (filtrado)
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <span>
            Valor total:{" "}
            {formatCurrency(
              filteredProducts.reduce((sum, p) => sum + p.price * p.quantity, 0)
            )}
          </span>
          <span>
            Stock total:{" "}
            {filteredProducts.reduce((sum, p) => sum + p.quantity, 0)} unidades
          </span>
        </div>
      </div>
    </div>
  );
}
