import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/app/stores";
import { queryKeys } from "@/shared/lib/query-keys";
import { esAdmin } from "@/shared/lib/roles";
import { getResumenPorSucursal } from "@/mocks/reportes";

export function useResumenPorSucursal(dias: number) {
  const rol = useAuthStore((s) => s.user?.rol);
  return useQuery({
    queryKey: queryKeys.resumenSucursales(dias),
    queryFn: () => getResumenPorSucursal(dias),
    enabled: esAdmin(rol),
    staleTime: 60 * 1000,
    retry: false,
  });
}
