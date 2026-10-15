

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as movementsApi from "@/mocks/movements";

export function useMovements(enabled = true) {
  const queryClient = useQueryClient();

  const movementsQuery = useQuery({
    queryKey: queryKeys.movements,
    queryFn: movementsApi.getAllMovements,
    staleTime: 30 * 1000,
    enabled,
  });

  const stockBajoQuery = useQuery({
    queryKey: queryKeys.stockBajo,
    queryFn: movementsApi.getStockBajo,
    staleTime: 60 * 1000,
  });

  const resumenQuery = useQuery({
    queryKey: queryKeys.resumen,
    queryFn: movementsApi.getResumenInventario,
    staleTime: 60 * 1000,
  });

  const invalidateAfterMutation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.movements });
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.resumen });
    queryClient.invalidateQueries({ queryKey: queryKeys.stockBajo });
  }, [queryClient]);

  const addMovementMutation = useMutation({
    mutationFn: async (vars: {
      productId: string;
      type: "entrada" | "salida";
      quantity: number;
      reason: string;
      price?: number | null;
      atribucion?: movementsApi.RegistrarMovimientoAtribucion;
      fecha?: string | null;
    }) => {
      if (!vars.reason.trim()) {
        throw new Error("El motivo del movimiento es obligatorio");
      }
      return movementsApi.registrarMovimiento(
        vars.productId,
        vars.type,
        vars.quantity,
        vars.reason,
        vars.price,
        vars.atribucion,
        vars.fecha
      );
    },
    onSuccess: invalidateAfterMutation,
  });

  const addMovementBulkMutation = useMutation({
    mutationFn: async (vars: {
      items: Array<{
        productId: string;
        quantity: number;
        type?: "entrada" | "salida";
        price?: number | null;
      }>;
      reason?: string;
      atribucion?: movementsApi.RegistrarMovimientoAtribucion;
    }) => {
      const reason = vars.reason ?? "Venta rápida";
      for (const item of vars.items) {
        await movementsApi.registrarMovimiento(
          item.productId,
          item.type ?? "entrada",
          item.quantity,
          reason,
          item.price ?? null,
          vars.atribucion
        );
      }
      return true;
    },
    onSuccess: invalidateAfterMutation,
  });

  const adjustStockTotalMutation = useMutation({
    mutationFn: async (vars: {
      productId: string;
      stockNuevo: number;
      reason: string;
      price?: number | null;
      atribucion?: movementsApi.RegistrarMovimientoAtribucion;
    }) => {
      if (!vars.reason.trim()) {
        throw new Error("El motivo del movimiento es obligatorio");
      }
      return movementsApi.ajustarStockTotal(
        vars.productId,
        vars.stockNuevo,
        vars.reason,
        vars.price,
        vars.atribucion
      );
    },
    onSuccess: invalidateAfterMutation,
  });

  const addVentaMutation = useMutation({
    mutationFn: movementsApi.registrarVenta,
    onSuccess: () => {
      invalidateAfterMutation();
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.all });
    },
  });

  const clearAllMovementsMutation = useMutation({
    mutationFn: movementsApi.eliminarTodosMovimientos,
    onSuccess: invalidateAfterMutation,
  });

  return {
    movements: movementsQuery.data ?? [],
    stockBajo: stockBajoQuery.data ?? [],
    resumenInventario: resumenQuery.data ?? null,
    isLoadingMovements: movementsQuery.isLoading,
    addMovement: (
      productId: string,
      type: "entrada" | "salida",
      quantity: number,
      reason: string,
      price?: number,
      atribucion?: movementsApi.RegistrarMovimientoAtribucion,
      fecha?: string | null
    ) =>
      addMovementMutation.mutateAsync({
        productId,
        type,
        quantity,
        reason,
        price,
        atribucion,
        fecha,
      }),
    addMovementBulk: (
      items: Array<{
        productId: string;
        quantity: number;
        type?: "entrada" | "salida";
        price?: number | null;
      }>,
      reason?: string,
      atribucion?: movementsApi.RegistrarMovimientoAtribucion
    ) => addMovementBulkMutation.mutateAsync({ items, reason, atribucion }),
    adjustStockTotal: (
      productId: string,
      stockNuevo: number,
      reason: string,
      price?: number,
      atribucion?: movementsApi.RegistrarMovimientoAtribucion
    ) =>
      adjustStockTotalMutation.mutateAsync({
        productId,
        stockNuevo,
        reason,
        price,
        atribucion,
      }),
    addVenta: addVentaMutation.mutateAsync,
    clearAllMovements: async () => { await clearAllMovementsMutation.mutateAsync(); },
  };
}
