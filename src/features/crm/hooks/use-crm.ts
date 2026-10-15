import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/app/stores";
import { queryKeys } from "@/shared/lib/query-keys";
import { esAdmin } from "@/shared/lib/roles";
import * as crmService from "@/mocks/crm";

export function useClientesCrm() {
  const rol = useAuthStore((s) => s.user?.rol);
  return useQuery({
    queryKey: queryKeys.crm.clientes,
    queryFn: crmService.getClientesCrm,
    enabled: esAdmin(rol),
    staleTime: 30 * 1000,
  });
}

export function useClienteDetalle(clienteId: number | null) {
  return useQuery({
    queryKey: queryKeys.crm.detalle(clienteId ?? 0),
    queryFn: () => crmService.getClienteDetalle(clienteId!),
    enabled: clienteId != null,
  });
}

export function useAgendaCrm(dias = 7) {
  const rol = useAuthStore((s) => s.user?.rol);
  return useQuery({
    queryKey: queryKeys.crm.agenda(dias),
    queryFn: () => crmService.getAgenda(dias),
    enabled: esAdmin(rol),
    staleTime: 30 * 1000,
  });
}

export function useCrmInteligencia() {
  const rol = useAuthStore((s) => s.user?.rol);
  return useQuery({
    queryKey: queryKeys.crm.inteligencia,
    queryFn: crmService.getCrmInteligencia,
    enabled: esAdmin(rol),
    staleTime: 60 * 1000,
  });
}

// Interpretación con IA del panel (bajo demanda; consume cupo de IA).
export function useAnalizarCrmIa() {
  return useMutation({ mutationFn: crmService.analizarCrmIa });
}

// Cualquier cambio del CRM refresca el listado, la agenda y las fichas.
function useInvalidarCrm() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.crm.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.clientes });
  };
}

export function useActualizarCliente() {
  const invalidar = useInvalidarCrm();
  return useMutation({
    mutationFn: (vars: { clienteId: number; datos: crmService.DatosCliente }) =>
      crmService.actualizarCliente(vars.clienteId, vars.datos),
    onSuccess: invalidar,
  });
}

export function useAgregarSeguimiento() {
  const invalidar = useInvalidarCrm();
  return useMutation({
    mutationFn: crmService.agregarSeguimiento,
    onSuccess: invalidar,
  });
}

export function useCompletarSeguimiento() {
  const invalidar = useInvalidarCrm();
  return useMutation({
    mutationFn: (vars: { id: string; hecho: boolean }) =>
      crmService.completarSeguimiento(vars.id, vars.hecho),
    onSuccess: invalidar,
  });
}

export function useEliminarSeguimiento() {
  const invalidar = useInvalidarCrm();
  return useMutation({
    mutationFn: crmService.eliminarSeguimiento,
    onSuccess: invalidar,
  });
}
