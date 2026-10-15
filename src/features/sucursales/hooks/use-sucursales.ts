import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, useSucursalStore } from "@/app/stores";
import { queryKeys } from "@/shared/lib/query-keys";
import { esAdmin } from "@/shared/lib/roles";
import * as sucursalesService from "@/mocks/sucursales";

export function useSucursales() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  return useQuery({
    queryKey: queryKeys.sucursales,
    queryFn: sucursalesService.getSucursales,
    enabled: isLoggedIn,
  });
}

export function useMiSucursal() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [...queryKeys.miSucursal, userId],
    queryFn: sucursalesService.getMiSucursal,
    enabled: !!userId,
  });
}

/**
 * Sucursal en la que opera el usuario.
 * - Admin: la que eligió en el header (si sigue activa) o la suya.
 * - Resto: siempre la suya. La base lo valida igual (invex_resolver_sucursal).
 */
export function useSucursalActiva() {
  const rol = useAuthStore((s) => s.user?.rol);
  const admin = esAdmin(rol);
  const { sucursalElegidaId, setSucursalElegidaId } = useSucursalStore();
  const { data: miSucursal } = useMiSucursal();
  const { data: sucursales = [] } = useSucursales();

  const activas = sucursales.filter((s) => s.activa);
  const elegida = admin ? activas.find((s) => s.id === sucursalElegidaId) : undefined;
  const sucursal = elegida ?? activas.find((s) => s.id === miSucursal?.id) ?? null;

  return {
    sucursal,
    sucursalId: sucursal?.id ?? miSucursal?.id ?? null,
    sucursales: activas,
    puedeCambiar: admin && activas.length > 1,
    setSucursal: setSucursalElegidaId,
  };
}

function useInvalidarSucursales() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.sucursales });
}

export function useCrearSucursal() {
  const invalidar = useInvalidarSucursales();
  return useMutation({
    mutationFn: sucursalesService.crearSucursal,
    onSuccess: invalidar,
  });
}

export function useEditarSucursal() {
  const invalidar = useInvalidarSucursales();
  return useMutation({
    mutationFn: sucursalesService.editarSucursal,
    onSuccess: invalidar,
  });
}

export function useAsignarSucursalUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, sucursalId }: { userId: string; sucursalId: string }) =>
      sucursalesService.asignarSucursalUsuario(userId, sucursalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sucursales });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
