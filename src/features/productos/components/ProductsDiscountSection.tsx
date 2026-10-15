

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import type { Product } from "@/shared/types/inventory";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type ConnectionStatus = "connecting" | "connected" | "error" | "offline";

export function ProductsDiscountSection({
  products,
  productsHasMore,
  productsLoadingMore,
  onLoadMoreProducts,
  onSearchProductsPage,
  connectionStatus,
  onApplyDiscount,
}: {
  products: Product[];
  productsHasMore: boolean;
  productsLoadingMore: boolean;
  onLoadMoreProducts: () => Promise<boolean>;
  onSearchProductsPage: (
    query: string,
    limit: number,
    offset: number,
    excludeOutOfStock: boolean
  ) => Promise<{ items: Product[]; hasMore: boolean }>;
  connectionStatus: ConnectionStatus;
  onApplyDiscount: (
    productIds: string[],
    percent: number,
    active: boolean
  ) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountActive, setDiscountActive] = useState<boolean>(true);
  const [showOnlyOffers, setShowOnlyOffers] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [serverSearchItems, setServerSearchItems] = useState<Product[]>([]);
  const [serverSearchHasMore, setServerSearchHasMore] = useState(false);
  const [serverSearchLoading, setServerSearchLoading] = useState(false);
  // Se incrementa al aplicar/quitar un descuento para re-buscar en el
  // servidor: cuando hay búsqueda activa, la lista sale de serverSearchItems
  // (estado local) y no la refresca la invalidación de react-query.
  const [refreshKey, setRefreshKey] = useState(0);

  const normalizeText = (value: string) => {
    return (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizedSearch = useMemo(() => normalizeText(search), [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearch]);

  useEffect(() => {
    let canceled = false;

    const run = async () => {
      if (!normalizedSearch) {
        setServerSearchItems([]);
        setServerSearchHasMore(false);
        setServerSearchLoading(false);
        return;
      }

      setServerSearchLoading(true);
      try {
        const res = await onSearchProductsPage(normalizedSearch, 200, 0, false);
        if (canceled) return;
        setServerSearchItems(res.items);
        setServerSearchHasMore(res.hasMore);
      } catch {
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
  }, [normalizedSearch, onSearchProductsPage, refreshKey]);

  const baseProductsForView = normalizedSearch ? serverSearchItems : products;

  const filtered = useMemo(() => {
    const list = showOnlyOffers
      ? baseProductsForView.filter((p) => {
          const percent = p.discountPercent != null ? Number(p.discountPercent) : 0;
          return Boolean(p.discountActive) && percent > 0;
        })
      : baseProductsForView;

    return [...list].sort((a, b) => {
      const aInStock = (a.quantity ?? 0) > 0;
      const bInStock = (b.quantity ?? 0) > 0;
      if (aInStock !== bInStock) return aInStock ? -1 : 1;

      const byName = a.name.localeCompare(b.name, "es", {
        sensitivity: "base",
      });
      if (byName !== 0) return byName;

      return a.code.localeCompare(b.code, "es", { sensitivity: "base" });
    });
  }, [baseProductsForView, showOnlyOffers]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

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

  const visibleIds = useMemo(
    () => paginatedProducts.map((p) => String(p.id)),
    [paginatedProducts]
  );

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulk = async () => {
    if (selectedIds.size === 0) return;
    if (connectionStatus === "offline") return;

    const percent = Math.max(0, Math.min(100, Number(discountPercent) || 0));

    try {
      setSubmitting(true);
      await onApplyDiscount(Array.from(selectedIds), percent, discountActive);
      setSelectedIds(new Set());
      setRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const removeBulk = async () => {
    if (selectedIds.size === 0) return;
    if (connectionStatus === "offline") return;

    try {
      setSubmitting(true);
      await onApplyDiscount(Array.from(selectedIds), 0, false);
      setSelectedIds(new Set());
      setRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">%:</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={String(discountPercent)}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={discountActive}
              onCheckedChange={(v) => setDiscountActive(Boolean(v))}
              id="discount-active"
            />
            <label
              htmlFor="discount-active"
              className="text-sm text-muted-foreground select-none"
            >
              Activar
            </label>
          </div>

          <Button
            onClick={applyBulk}
            disabled={
              submitting ||
              selectedCount === 0 ||
              connectionStatus === "offline" ||
              connectionStatus === "connecting"
            }
          >
            Aplicar a {selectedCount}
          </Button>

          <Button
            onClick={removeBulk}
            disabled={
              submitting ||
              selectedCount === 0 ||
              connectionStatus === "offline" ||
              connectionStatus === "connecting"
            }
            variant="outline"
          >
            Quitar oferta
          </Button>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={
              productsLoadingMore ||
              serverSearchLoading ||
              connectionStatus === "offline" ||
              (currentPage >= totalPages && !productsHasMore)
            }
            className="flex items-center gap-2"
            title="Página siguiente"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={toggleSelectAllVisible}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm select-none">
              Seleccionar todo (visible)
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            {serverSearchLoading
              ? "Buscando..."
              : `Mostrando ${paginatedProducts.length} de ${filtered.length}`}
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_110px] sm:grid-cols-[40px_1fr_140px_140px] bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <div></div>
          <div>Producto</div>
          <div className="text-right">Stock</div>
          <div className="hidden sm:block text-right">Descuento</div>
        </div>

        <div className="divide-y">
          {paginatedProducts.map((p) => {
            const id = String(p.id);
            const checked = selectedIds.has(id);
            const currentDiscount = p.discountActive
              ? `${p.discountPercent || 0}%`
              : "-";

            return (
              <div
                key={id}
                className="grid grid-cols-[40px_1fr_110px] sm:grid-cols-[40px_1fr_140px_140px] items-center px-3 py-2"
              >
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOne(id)}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.code} · {p.category}
                  </div>
                </div>
                <div className="text-sm text-right tabular-nums">
                  {p.quantity ?? 0}
                </div>
                <div className="hidden sm:block text-sm text-right tabular-nums">
                  {currentDiscount}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
