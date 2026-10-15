import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as asistenteApi from "@/mocks/asistente";
import type { DecisionAgente, ResolucionDecision } from "@/mocks/asistente";

export const AGENTE_KEY = ["asistente", "agente"] as const;

export type AvisoDecision = { titulo: string; mensaje: string; whatsapp_url: string | null; error?: boolean };

export function useAgente() {
  const queryClient = useQueryClient();
  const [aviso, setAviso] = useState<AvisoDecision | null>(null);

  const estadoQuery = useQuery({
    queryKey: AGENTE_KEY,
    queryFn: asistenteApi.getAgenteEstado,
    // La revisión automática corre en el servidor: se vuelve a consultar cada minuto para verla aparecer.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const revisarMutation = useMutation({
    mutationFn: asistenteApi.revisarNegocio,
    onMutate: () => setAviso(null),
    onSettled: () => queryClient.invalidateQueries({ queryKey: AGENTE_KEY }),
  });

  const resolverMutation = useMutation({
    mutationFn: (vars: { decision: DecisionAgente; resolucion: ResolucionDecision }) =>
      asistenteApi.resolverDecision(vars.decision.id, vars.resolucion),
    onSuccess: (data, { decision, resolucion }) => {
      setAviso({
        titulo: decision.titulo,
        mensaje: data.mensaje,
        // Para cobrar, WhatsApp ya se abrió desde el botón; el enlace queda por si hay que reabrirlo.
        whatsapp_url: resolucion === "aprobar" ? data.whatsapp_url : null,
      });
      if (resolucion === "aprobar" && (decision.tipo === "precio" || decision.tipo === "descuento")) {
        // Cambió un precio: que se refresquen también productos, ofertas y el resto de las pantallas.
        queryClient.invalidateQueries();
      } else {
        queryClient.invalidateQueries({ queryKey: AGENTE_KEY });
      }
    },
    onError: (error: Error, { decision }) => setAviso({ titulo: decision.titulo, mensaje: error.message, whatsapp_url: null, error: true }),
  });

  return {
    estado: estadoQuery.data,
    cargando: estadoQuery.isLoading,
    errorEstado: estadoQuery.error?.message,

    revisar: () => revisarMutation.mutate(),
    revisando: revisarMutation.isPending,
    errorRevision: revisarMutation.error?.message,

    resolver: (decision: DecisionAgente, resolucion: ResolucionDecision) => resolverMutation.mutate({ decision, resolucion }),
    resolviendoId: resolverMutation.isPending ? resolverMutation.variables?.decision.id : undefined,

    aviso,
    cerrarAviso: () => setAviso(null),
  };
}
