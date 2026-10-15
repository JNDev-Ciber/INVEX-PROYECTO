

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import * as categoriasApi from "@/mocks/categorias";

export function useCategorias() {
  const [subcategorias, setSubcategorias] = useState<any[]>([]);

  const categoriasQuery = useQuery({
    queryKey: queryKeys.categorias,
    queryFn: categoriasApi.getCategorias,
    staleTime: 30 * 60 * 1000,
  });

  const loadSubcategoriasByCategoria = useCallback(
    async (categoriaId: string | number) => {
      const data = await categoriasApi.getSubcategoriasPorCategoria(categoriaId);
      setSubcategorias(data);
      return data;
    },
    []
  );

  return {
    categorias: categoriasQuery.data ?? [],
    subcategorias,
    isLoadingCategorias: categoriasQuery.isLoading,
    loadSubcategoriasByCategoria,
  };
}
