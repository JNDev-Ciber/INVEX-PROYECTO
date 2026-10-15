import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as api from "@/mocks/ventas-empleados";

export function useVentasPorEmpleado(fechaInicio: string, fechaFin: string) {
  const query = useQuery({
    queryKey: queryKeys.ventasPorEmpleado(fechaInicio, fechaFin),
    queryFn: () => api.getVentasPorEmpleado(fechaInicio, fechaFin),
    staleTime: 30 * 1000,
  });

  return {
    ventas: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
