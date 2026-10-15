import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as remitosService from "@/mocks/remitos";

export function useRemitos() {
  return useQuery({
    queryKey: queryKeys.remitos,
    queryFn: () => remitosService.getRemitos(),
    staleTime: 15 * 1000,
  });
}

export function useRemitoItems(remitoId: string | null) {
  return useQuery({
    queryKey: queryKeys.remitoItems(remitoId ?? ""),
    queryFn: () => remitosService.getRemitoItems(remitoId!),
    enabled: !!remitoId,
  });
}

export function useBuscarStockParaRemito(sucursalId: string | null, busqueda: string) {
  return useQuery({
    queryKey: ["remitos", "stock", sucursalId, busqueda],
    queryFn: () => remitosService.buscarStockParaRemito(sucursalId!, busqueda),
    enabled: !!sucursalId,
    staleTime: 10 * 1000,
  });
}

/** Cualquier cambio en un remito mueve stock: se recarga todo lo que lo muestra. */
function useInvalidarTrasRemito() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.remitos });
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.movements });
    queryClient.invalidateQueries({ queryKey: queryKeys.resumen });
    queryClient.invalidateQueries({ queryKey: queryKeys.stockBajo });
    queryClient.invalidateQueries({ queryKey: queryKeys.sucursales });
  };
}

export function useCrearRemito() {
  const invalidar = useInvalidarTrasRemito();
  return useMutation({
    mutationFn: async (vars: Parameters<typeof remitosService.crearRemito>[0] & { enviar: boolean }) => {
      const { enviar, ...payload } = vars;
      const id = await remitosService.crearRemito(payload);
      if (enviar) await remitosService.enviarRemito(id);
      return id;
    },
    onSettled: invalidar,
  });
}

export function useEnviarRemito() {
  const invalidar = useInvalidarTrasRemito();
  return useMutation({ mutationFn: remitosService.enviarRemito, onSettled: invalidar });
}

export function useRecibirRemito() {
  const invalidar = useInvalidarTrasRemito();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: Array<{ producto_id: string; cantidad_recibida: number }> }) =>
      remitosService.recibirRemito(id, items),
    onSettled: invalidar,
  });
}

export function useAnularRemito() {
  const invalidar = useInvalidarTrasRemito();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      remitosService.anularRemito(id, motivo),
    onSettled: invalidar,
  });
}
