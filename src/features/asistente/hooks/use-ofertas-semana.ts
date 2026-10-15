import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as asistenteApi from "@/mocks/asistente";
import type { OfertaAPublicar } from "@/mocks/asistente";

const OFERTAS_SEMANA_KEY = ["asistente", "ofertas-semana"] as const;

export function useOfertasSemana() {
  const queryClient = useQueryClient();

  const estadoQuery = useQuery({
    queryKey: OFERTAS_SEMANA_KEY,
    queryFn: asistenteApi.getOfertasEstado,
    staleTime: 30_000,
  });

  const proponerMutation = useMutation({ mutationFn: asistenteApi.proponerOfertas });

  const publicarMutation = useMutation({
    mutationFn: (datos: { resumen: string; ofertas: OfertaAPublicar[] }) => asistenteApi.publicarOfertas(datos),
    onSuccess: () => {
      proponerMutation.reset();
      // Cambian descuentos: que se refresquen también productos y ofertas en otras pantallas.
      queryClient.invalidateQueries();
    },
  });

  const retirarMutation = useMutation({
    mutationFn: (ofertaId?: string) => asistenteApi.retirarOfertas(ofertaId),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return {
    estado: estadoQuery.data,
    cargando: estadoQuery.isLoading,
    errorEstado: estadoQuery.error?.message,

    propuesta: proponerMutation.data,
    proponiendo: proponerMutation.isPending,
    errorPropuesta: proponerMutation.error?.message,
    proponer: () => proponerMutation.mutate(),
    descartarPropuesta: () => proponerMutation.reset(),

    publicar: (datos: { resumen: string; ofertas: OfertaAPublicar[] }) => publicarMutation.mutate(datos),
    publicando: publicarMutation.isPending,
    errorPublicar: publicarMutation.error?.message,
    mensajePublicar: publicarMutation.data?.mensaje,

    retirar: (ofertaId?: string) => retirarMutation.mutate(ofertaId),
    retirando: retirarMutation.isPending,
    errorRetirar: retirarMutation.error?.message,
  };
}
