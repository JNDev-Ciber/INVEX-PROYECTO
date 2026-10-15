import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import { useAuthStore } from "@/app/stores/auth.store";
import * as api from "@/mocks/pedidos-web";
import type { MetodoPagoPedido, PedidoWebItem } from "@/mocks/pedidos-web";

export function usePedidosWebPendientes() {
  const queryClient = useQueryClient();
  const procesadoPor = useAuthStore((s) => s.user?.username ?? "");

  const query = useQuery({
    queryKey: queryKeys.pedidosWebPendientes,
    queryFn: api.getPedidosWebPendientes,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pedidosWebPendientes });
    queryClient.invalidateQueries({ queryKey: queryKeys.historialPedidosWeb });
  }, [queryClient]);

  const editarMutation = useMutation({
    mutationFn: (args: { id: string; carrito: PedidoWebItem[] }) =>
      api.editarPedidoWeb(args),
    onSuccess: invalidate,
  });

  const aprobarMutation = useMutation({
    mutationFn: (args: {
      id: string;
      metodoPago: MetodoPagoPedido;
      carrito?: PedidoWebItem[];
    }) =>
      api.aprobarPedidoWeb({
        id: args.id,
        procesadoPor,
        metodoPago: args.metodoPago,
        carrito: args.carrito,
      }),
    onSuccess: invalidate,
  });

  const sincronizarMutation = useMutation({
    mutationFn: api.sincronizarPagosMercadoPago,
    onSuccess: invalidate,
  });

  const rechazarMutation = useMutation({
    mutationFn: (args: { id: string; motivo?: string }) =>
      api.rechazarPedidoWeb({ id: args.id, procesadoPor, motivo: args.motivo }),
    onSuccess: invalidate,
  });

  return {
    pedidos: query.data ?? [],
    isLoading: query.isLoading,
    editarPedido: (id: string, carrito: PedidoWebItem[]) =>
      editarMutation.mutateAsync({ id, carrito }),
    aprobarPedido: (
      id: string,
      metodoPago: MetodoPagoPedido,
      carrito?: PedidoWebItem[]
    ) => aprobarMutation.mutateAsync({ id, metodoPago, carrito }),
    rechazarPedido: (id: string, motivo?: string) =>
      rechazarMutation.mutateAsync({ id, motivo }),
    isEditando: editarMutation.isPending,
    isAprobando: aprobarMutation.isPending,
    isRechazando: rechazarMutation.isPending,
    sincronizarPagos: () => sincronizarMutation.mutateAsync(),
    isSincronizando: sincronizarMutation.isPending,
  };
}

/**
 * Solo la cantidad de pedidos pendientes, para el badge del menu.
 * Comparte queryKey (y por lo tanto cache y request) con
 * usePedidosWebPendientes: tener las dos montadas no duplica llamadas.
 */
export function usePedidosWebPendientesCount(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.pedidosWebPendientes,
    queryFn: api.getPedidosWebPendientes,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
    enabled,
    select: (pedidos) => pedidos.length,
  });

  return query.data ?? 0;
}

export function useHistorialPedidosWeb(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.historialPedidosWeb,
    queryFn: () => api.getHistorialPedidosWeb(50, 0),
    staleTime: 30 * 1000,
    enabled,
  });

  return {
    historial: query.data ?? [],
    isLoading: query.isLoading,
  };
}
