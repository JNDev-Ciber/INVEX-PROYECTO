

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as movementsApi from "@/mocks/movements";

/**
 * Hook minimalista para el chrome del dashboard.
 * Solo dispara las 2 queries que el layout necesita: resumen + stockBajo.
 * Las páginas internas piden sus propios datos.
 */
export function useDashboardShell() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const resumenQuery = useQuery({
    queryKey: queryKeys.resumen,
    queryFn: movementsApi.getResumenInventario,
    staleTime: 60 * 1000,
  });

  const stockBajoQuery = useQuery({
    queryKey: queryKeys.stockBajo,
    queryFn: movementsApi.getStockBajo,
    staleTime: 60 * 1000,
  });

  const isLoading = resumenQuery.isLoading || stockBajoQuery.isLoading;
  const errorMsg =
    (resumenQuery.error as Error | undefined)?.message ??
    (stockBajoQuery.error as Error | undefined)?.message ??
    null;

  const connectionStatus: "connecting" | "connected" | "error" | "offline" =
    isLoading ? "connecting" : errorMsg ? "error" : "connected";

  return {
    isMobile,
    isLoading,
    error: errorMsg,
    connectionStatus,
    resumen: resumenQuery.data ?? null,
    lowStockAlertsCount: stockBajoQuery.data?.length ?? 0,
    retryConnection: () => {
      resumenQuery.refetch();
      stockBajoQuery.refetch();
    },
  };
}
