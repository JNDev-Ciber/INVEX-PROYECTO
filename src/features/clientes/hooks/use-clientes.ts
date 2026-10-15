

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as clientesApi from "@/mocks/clientes";
import * as ventasFiadoApi from "@/mocks/ventas-fiado";

export function useClientes(enabled = true) {
  const queryClient = useQueryClient();

  const clientesQuery = useQuery({
    queryKey: queryKeys.clientes,
    queryFn: clientesApi.getAllClientes,
    staleTime: 60 * 1000,
    enabled,
  });

  const ventasFiadoQuery = useQuery({
    queryKey: queryKeys.ventasFiado,
    queryFn: ventasFiadoApi.getVentasFiado,
    staleTime: 30 * 1000,
    enabled,
  });

  const pagosQuery = useQuery({
    queryKey: queryKeys.pagos,
    queryFn: ventasFiadoApi.getPagos,
    staleTime: 30 * 1000,
    enabled,
  });

  const invalidate = useCallback(
    (...keys: any[]) => {
      keys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
    },
    [queryClient]
  );

  const addClienteMutation = useMutation({
    mutationFn: (vars: { nombre: string; cuit: string; telefono: string }) =>
      clientesApi.agregarCliente(vars.nombre, vars.cuit, vars.telefono),
    onSuccess: () => invalidate(queryKeys.clientes),
  });

  const deleteClienteMutation = useMutation({
    mutationFn: clientesApi.eliminarCliente,
    onSuccess: () =>
      invalidate(queryKeys.clientes, queryKeys.ventasFiado, queryKeys.pagos),
  });

  const addDeudaDirectaMutation = useMutation({
    mutationFn: (vars: { clienteId: number; monto: number; concepto: string }) => {
      if (vars.monto <= 0) {
        return Promise.reject(new Error("El monto debe ser mayor a 0"));
      }
      return clientesApi.agregarDeudaDirecta(
        vars.clienteId,
        vars.monto,
        vars.concepto
      );
    },
    onSuccess: () => invalidate(queryKeys.clientes, queryKeys.ventasFiado),
  });

  const registrarPagoParcialMutation = useMutation({
    mutationFn: (vars: { clienteId: number; monto: number }) => {
      if (vars.monto <= 0) {
        return Promise.reject(new Error("El monto debe ser mayor a 0"));
      }
      return clientesApi.registrarPagoParcial(vars.clienteId, vars.monto);
    },
    onSuccess: () =>
      invalidate(queryKeys.clientes, queryKeys.ventasFiado, queryKeys.pagos),
  });

  const addVentaFiadoMutation = useMutation({
    mutationFn: (vars: {
      clienteId: number;
      productos: Array<{ productoId: string; cantidad: number }>;
      atribucion?: ventasFiadoApi.VentaFiadoAtribucion;
    }) =>
      ventasFiadoApi.agregarVentaFiado(
        vars.clienteId,
        vars.productos,
        vars.atribucion
      ),
    onSuccess: () =>
      invalidate(
        queryKeys.clientes,
        queryKeys.ventasFiado,
        queryKeys.products.all,
        queryKeys.movements,
        queryKeys.resumen,
        queryKeys.stockBajo
      ),
  });

  const marcarProductosPagadosMutation = useMutation({
    mutationFn: (vars: { detalleIds: number[]; ventaId: number }) =>
      ventasFiadoApi.marcarProductosPagados(vars.detalleIds, vars.ventaId),
    onSuccess: () =>
      invalidate(queryKeys.ventasFiado, queryKeys.clientes, queryKeys.pagos),
  });

  return {
    clientesVentas: clientesQuery.data ?? [],
    ventasFiado: ventasFiadoQuery.data ?? [],
    pagos: pagosQuery.data ?? [],
    isLoadingClientes: clientesQuery.isLoading,
    addCliente: (nombre: string, cuit: string, telefono: string) =>
      addClienteMutation.mutateAsync({ nombre, cuit, telefono }),
    deleteCliente: (clienteId: number) =>
      deleteClienteMutation.mutateAsync(clienteId),
    addDeudaDirecta: (clienteId: number, monto: number, concepto: string) =>
      addDeudaDirectaMutation.mutateAsync({ clienteId, monto, concepto }),
    registrarPagoParcial: (clienteId: number, monto: number) =>
      registrarPagoParcialMutation.mutateAsync({ clienteId, monto }),
    addVentaFiado: (
      clienteId: number,
      productos: Array<{ productoId: string; cantidad: number }>,
      atribucion?: ventasFiadoApi.VentaFiadoAtribucion
    ) => addVentaFiadoMutation.mutateAsync({ clienteId, productos, atribucion }),
    marcarProductosPagados: (detalleIds: number[], ventaId: number) =>
      marcarProductosPagadosMutation.mutateAsync({ detalleIds, ventaId }),
  };
}
