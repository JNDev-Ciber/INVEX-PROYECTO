import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as api from "@/mocks/empleados";

export function useEmpleados(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.empleados,
    queryFn: api.getAllEmpleados,
    staleTime: 60 * 1000,
    enabled,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.empleados });
  }, [queryClient]);

  const agregarMutation = useMutation({
    mutationFn: api.agregarEmpleado,
    onSuccess: invalidate,
  });

  const editarMutation = useMutation({
    mutationFn: api.editarEmpleado,
    onSuccess: invalidate,
  });

  const desactivarMutation = useMutation({
    mutationFn: api.desactivarEmpleado,
    onSuccess: invalidate,
  });

  const vincularUsuarioMutation = useMutation({
    mutationFn: ({ empleadoId, usuarioId }: { empleadoId: string; usuarioId: string | null }) =>
      api.vincularUsuarioEmpleado(empleadoId, usuarioId),
    onSuccess: invalidate,
  });

  return {
    empleados: query.data ?? [],
    isLoading: query.isLoading,
    agregarEmpleado: (params: Parameters<typeof api.agregarEmpleado>[0]) =>
      agregarMutation.mutateAsync(params),
    editarEmpleado: (params: Parameters<typeof api.editarEmpleado>[0]) =>
      editarMutation.mutateAsync(params),
    desactivarEmpleado: (id: string) => desactivarMutation.mutateAsync(id),
    vincularUsuario: (empleadoId: string, usuarioId: string | null) =>
      vincularUsuarioMutation.mutateAsync({ empleadoId, usuarioId }),
    isAgregando: agregarMutation.isPending,
    isEditando: editarMutation.isPending,
  };
}

export function useJornadasEmpleado(
  empleadoId: string | null,
  fechaInicio: string,
  fechaFin: string
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.jornadas(empleadoId ?? "", fechaInicio, fechaFin),
    queryFn: () =>
      api.getJornadasEmpleado({
        empleado_id: empleadoId!,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }),
    enabled: !!empleadoId,
    staleTime: 30 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["jornadas"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.semanasPago(empleadoId ?? "") });
  }, [queryClient, empleadoId]);

  const registrarMutation = useMutation({
    mutationFn: api.registrarJornada,
    onSuccess: invalidate,
  });

  const eliminarMutation = useMutation({
    mutationFn: ({ eId, fecha }: { eId: string; fecha: string }) =>
      api.eliminarJornada(eId, fecha),
    onSuccess: invalidate,
  });

  const calcularMutation = useMutation({
    mutationFn: api.calcularSemanaPago,
    onSuccess: invalidate,
  });

  return {
    jornadas: query.data ?? [],
    isLoading: query.isLoading,
    registrarJornada: (params: Parameters<typeof api.registrarJornada>[0]) =>
      registrarMutation.mutateAsync(params),
    eliminarJornada: (eId: string, fecha: string) =>
      eliminarMutation.mutateAsync({ eId, fecha }),
    calcularSemana: (params: Parameters<typeof api.calcularSemanaPago>[0]) =>
      calcularMutation.mutateAsync(params),
    isRegistrando: registrarMutation.isPending,
    isCalculando: calcularMutation.isPending,
  };
}

export function useSemanasEmpleado(empleadoId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.semanasPago(empleadoId ?? ""),
    queryFn: () => api.getSemanasEmpleado(empleadoId!, 10),
    enabled: !!empleadoId,
    staleTime: 30 * 1000,
  });

  const marcarMutation = useMutation({
    mutationFn: api.marcarSemanaPagada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semanasPago(empleadoId ?? "") });
    },
  });

  return {
    semanas: query.data ?? [],
    isLoading: query.isLoading,
    marcarPagada: (params: Parameters<typeof api.marcarSemanaPagada>[0]) =>
      marcarMutation.mutateAsync(params),
    isMarkingPaid: marcarMutation.isPending,
  };
}
