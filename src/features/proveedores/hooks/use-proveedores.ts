import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as proveedoresApi from "@/mocks/proveedores";
import * as comprasApi from "@/mocks/compras-proveedor";
import type { ProductoCompra } from "@/mocks/compras-proveedor";

export function useProveedores(proveedorId?: string) {
  const queryClient = useQueryClient();

  const proveedoresQuery = useQuery({
    queryKey: queryKeys.proveedores,
    queryFn: proveedoresApi.getAllProveedores,
    staleTime: 60 * 1000,
  });

  const comprasQuery = useQuery({
    queryKey: queryKeys.comprasProveedor(proveedorId ?? ""),
    queryFn: () => comprasApi.getComprasProveedor(proveedorId!),
    staleTime: 30 * 1000,
    enabled: !!proveedorId,
  });

  const pagosQuery = useQuery({
    queryKey: queryKeys.pagosProveedor(proveedorId ?? ""),
    queryFn: () => comprasApi.getPagosProveedor(proveedorId!),
    staleTime: 30 * 1000,
    enabled: !!proveedorId,
  });

  const deudaQuery = useQuery({
    queryKey: queryKeys.deudaProveedores,
    queryFn: proveedoresApi.getDeudaProveedores,
    staleTime: 60 * 1000,
  });

  const invalidate = useCallback(
    (...keys: any[]) => {
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    [queryClient]
  );

  const addProveedorMutation = useMutation({
    mutationFn: (vars: {
      nombre: string;
      cuit?: string;
      telefono?: string;
      email?: string;
      direccion?: string;
    }) =>
      proveedoresApi.agregarProveedor(
        vars.nombre,
        vars.cuit,
        vars.telefono,
        vars.email,
        vars.direccion
      ),
    onSuccess: () => invalidate(queryKeys.proveedores),
  });

  const deleteProveedorMutation = useMutation({
    mutationFn: proveedoresApi.eliminarProveedor,
    onSuccess: () =>
      invalidate(
        queryKeys.proveedores,
        queryKeys.deudaProveedores,
        proveedorId ? queryKeys.comprasProveedor(proveedorId) : null,
        proveedorId ? queryKeys.pagosProveedor(proveedorId) : null
      ),
  });

  const addDeudaDirectaMutation = useMutation({
    mutationFn: (vars: { proveedorId: string; monto: number; concepto: string }) => {
      if (vars.monto <= 0) return Promise.reject(new Error("El monto debe ser mayor a 0"));
      return proveedoresApi.agregarDeudaDirectaProveedor(
        vars.proveedorId,
        vars.monto,
        vars.concepto
      );
    },
    onSuccess: (_, vars) =>
      invalidate(
        queryKeys.proveedores,
        queryKeys.comprasProveedor(vars.proveedorId),
        queryKeys.deudaProveedores
      ),
  });

  const registrarPagoMutation = useMutation({
    mutationFn: (vars: { proveedorId: string; monto: number; concepto?: string }) => {
      if (vars.monto <= 0) return Promise.reject(new Error("El monto debe ser mayor a 0"));
      return proveedoresApi.registrarPagoProveedor(vars.proveedorId, vars.monto, vars.concepto);
    },
    onSuccess: (_, vars) =>
      invalidate(
        queryKeys.proveedores,
        queryKeys.comprasProveedor(vars.proveedorId),
        queryKeys.pagosProveedor(vars.proveedorId),
        queryKeys.deudaProveedores
      ),
  });

  const addCompraProductosMutation = useMutation({
    mutationFn: (vars: {
      proveedorId: string;
      productos: ProductoCompra[];
      concepto?: string;
    }) =>
      comprasApi.agregarCompraConProductos(vars.proveedorId, vars.productos, vars.concepto),
    onSuccess: (_, vars) =>
      invalidate(
        queryKeys.proveedores,
        queryKeys.comprasProveedor(vars.proveedorId),
        queryKeys.deudaProveedores,
        queryKeys.products.all,
        queryKeys.movements,
        queryKeys.resumen,
        queryKeys.stockBajo
      ),
  });

  return {
    proveedores: proveedoresQuery.data ?? [],
    compras: comprasQuery.data ?? [],
    pagos: pagosQuery.data ?? [],
    deudaProveedores: deudaQuery.data ?? [],
    isLoadingProveedores: proveedoresQuery.isLoading,
    isLoadingCompras: comprasQuery.isLoading,

    addProveedor: (
      nombre: string,
      cuit?: string,
      telefono?: string,
      email?: string,
      direccion?: string
    ) => addProveedorMutation.mutateAsync({ nombre, cuit, telefono, email, direccion }),

    deleteProveedor: (proveedorId: string) =>
      deleteProveedorMutation.mutateAsync(proveedorId),

    addDeudaDirecta: (proveedorId: string, monto: number, concepto: string) =>
      addDeudaDirectaMutation.mutateAsync({ proveedorId, monto, concepto }),

    registrarPago: (proveedorId: string, monto: number, concepto?: string) =>
      registrarPagoMutation.mutateAsync({ proveedorId, monto, concepto }),

    addCompraProductos: (
      proveedorId: string,
      productos: ProductoCompra[],
      concepto?: string
    ) => addCompraProductosMutation.mutateAsync({ proveedorId, productos, concepto }),
  };
}
