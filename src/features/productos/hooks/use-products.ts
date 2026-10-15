

import { useCallback, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as productsApi from "@/mocks/products";
import type { Product } from "@/shared/types/inventory";

const DEFAULT_LIMIT = 200;

export function useProducts() {
  const queryClient = useQueryClient();
  const [extra, setExtra] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef<number>(DEFAULT_LIMIT);
  const barcodeCacheRef = useRef<Map<string, Product>>(new Map());

  const query = useQuery({
    queryKey: queryKeys.products.list(DEFAULT_LIMIT),
    queryFn: async () => {
      const { items, raw } = await productsApi.getProductsPage(
        DEFAULT_LIMIT,
        0
      );
      offsetRef.current = items.length;
      setHasMore(raw.length === DEFAULT_LIMIT);
      setExtra([]);
      return items;
    },
    staleTime: 30 * 1000,
  });

  const products = useMemo(() => {
    const base = query.data ?? [];
    if (extra.length === 0) return base;
    const ids = new Set(base.map((p) => String(p.id)));
    return [...base, ...extra.filter((p) => !ids.has(String(p.id)))];
  }, [query.data, extra]);

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || loadingMore) return false;
    setLoadingMore(true);
    try {
      const { items, raw } = await productsApi.getProductsPage(
        DEFAULT_LIMIT,
        offsetRef.current
      );
      offsetRef.current += items.length;
      setHasMore(raw.length === DEFAULT_LIMIT);
      setExtra((prev) => [...prev, ...items]);
      return true;
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore]);

  const searchProductsPage = useCallback(
    async (
      queryStr: string,
      limit: number,
      offset: number,
      excludeOutOfStock: boolean
    ): Promise<{ items: Product[]; hasMore: boolean }> => {
      const cleaned = String(queryStr || "").trim();
      if (!cleaned) {
        const { items, raw } = await productsApi.getProductsPage(
          limit,
          offset
        );
        const filtered = excludeOutOfStock
          ? items.filter((p) => p.quantity > 0)
          : items;
        return { items: filtered, hasMore: raw.length === limit };
      }
      const { items, raw } = await productsApi.searchProductsAll(
        cleaned,
        limit,
        offset
      );
      const filtered = excludeOutOfStock
        ? items.filter((p) => p.quantity > 0)
        : items;
      return { items: filtered, hasMore: raw.length === limit };
    },
    []
  );

  const getProductByBarcode = useCallback(
    async (barcode: string): Promise<Product | undefined> => {
      const cleaned = String(barcode || "")
        .trim()
        .replace(/\s+/g, "");
      if (!cleaned) return undefined;
      const cached = barcodeCacheRef.current.get(cleaned);
      if (cached) return cached;
      const local = products.find((p) => {
        const pb = p.barcode ? String(p.barcode).trim().replace(/\s+/g, "") : "";
        return pb === cleaned;
      });
      if (local) {
        barcodeCacheRef.current.set(cleaned, local);
        return local;
      }
      const found = await productsApi.getProductByBarcode(cleaned);
      if (found) barcodeCacheRef.current.set(cleaned, found);
      return found;
    },
    [products]
  );

  const invalidateAfterMutation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.resumen });
    queryClient.invalidateQueries({ queryKey: queryKeys.stockBajo });
    setExtra([]);
    offsetRef.current = DEFAULT_LIMIT;
  }, [queryClient]);

  const addProductMutation = useMutation({
    mutationFn: productsApi.agregarProducto,
    onSuccess: invalidateAfterMutation,
  });

  const updateProductMutation = useMutation({
    mutationFn: async (vars: { id: string; updates: any }) => {
      const current = products.find((p) => String(p.id) === String(vars.id));
      const u = vars.updates;
      const code = u.code ?? current?.code;
      const name = u.name ?? current?.name;
      const category = u.category ?? current?.category;
      const quantity = u.quantity ?? current?.quantity;
      const minStock = u.minStock ?? current?.minStock;
      const cost = u.cost ?? current?.cost;
      const price = u.price ?? current?.price;
      const barcodeCleaned =
        u.barcode !== undefined
          ? String(u.barcode || "")
              .trim()
              .replace(/\s+/g, "")
          : undefined;
      const barcodeNormalized =
        barcodeCleaned !== undefined
          ? barcodeCleaned && barcodeCleaned !== "0"
            ? barcodeCleaned
            : null
          : undefined;
      if (!code || !name || !category) {
        throw new Error(
          "No se pudo actualizar: faltan datos del producto (recargá la página y volvé a intentar)."
        );
      }
      return productsApi.editarProducto({
        id: vars.id,
        code,
        name,
        category,
        quantity: quantity ?? 0,
        minStock: minStock ?? 0,
        cost: cost ?? 0,
        price: price ?? 0,
        description:
          u.description !== undefined ? u.description : current?.description ?? null,
        imageUrl:
          u.imageUrl !== undefined ? u.imageUrl : current?.imageUrl ?? null,
        barcode:
          barcodeNormalized !== undefined ? barcodeNormalized : current?.barcode ?? null,
        subcategory:
          u.subcategory !== undefined ? u.subcategory : current?.subcategory ?? null,
      });
    },
    onSuccess: invalidateAfterMutation,
  });

  const deleteProductMutation = useMutation({
    mutationFn: productsApi.desactivarProducto,
    onSuccess: invalidateAfterMutation,
  });

  const updateBarcodeMutation = useMutation({
    mutationFn: async (vars: { id: string; barcode: string }) => {
      await productsApi.actualizarCodigoBarras(vars.id, vars.barcode);
      const cleaned = String(vars.barcode || "").trim().replace(/\s+/g, "");
      if (cleaned) {
        try {
          const found = await productsApi.getProductByBarcode(cleaned);
          if (found) barcodeCacheRef.current.set(cleaned, found);
        } catch {}
      }
      return true;
    },
    onSuccess: invalidateAfterMutation,
  });

  const updateDiscountMutation = useMutation({
    mutationFn: async (vars: {
      id: string;
      discountPercent: number;
      discountActive: boolean;
    }) => {
      const normalized = Math.max(0, Math.min(100, Number(vars.discountPercent) || 0));
      return productsApi.actualizarDescuento(
        vars.id,
        normalized,
        Boolean(vars.discountActive)
      );
    },
    onSuccess: invalidateAfterMutation,
  });

  const updatePricesByCategoryMutation = useMutation({
    mutationFn: async (vars: { category: string; percentage: number }) =>
      productsApi.actualizarPreciosCategoria(vars.category, vars.percentage),
    onSuccess: invalidateAfterMutation,
  });

  return {
    products,
    productsHasMore: hasMore,
    productsLoadingMore: loadingMore,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    loadMoreProducts,
    searchProductsPage,
    getProductByBarcode,
    addProduct: (data: Parameters<typeof productsApi.agregarProducto>[0]) =>
      addProductMutation.mutateAsync(data),
    updateProduct: (id: string, updates: any) =>
      updateProductMutation.mutateAsync({ id, updates }),
    deleteProduct: (id: string) => deleteProductMutation.mutateAsync(id),
    updateBarcode: (id: string, barcode: string) =>
      updateBarcodeMutation.mutateAsync({ id, barcode }),
    updateDiscount: (id: string, discountPercent: number, discountActive: boolean) =>
      updateDiscountMutation.mutateAsync({ id, discountPercent, discountActive }),
    updatePricesByCategory: (category: string, percentage: number) =>
      updatePricesByCategoryMutation.mutateAsync({ category, percentage }),
  };
}
