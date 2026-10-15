import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as asistenteApi from "@/mocks/asistente";
import type { ChatMessage, Propuesta } from "@/mocks/asistente";

export type EstadoPropuesta = {
  estado: "pendiente" | "aplicando" | "aplicada" | "descartada" | "error";
  mensaje?: string;
};

export function useAsistente() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rawHistory, setRawHistory] = useState<unknown[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoPropuesta>>({});

  const setEstado = (id: string, estado: EstadoPropuesta) =>
    setEstados((prev) => ({ ...prev, [id]: estado }));

  const sendMutation = useMutation({
    mutationFn: async (text: string) => asistenteApi.sendMessage(text, rawHistory),
    onMutate: (text: string) => {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, propuestas: data.propuestas },
      ]);
      setRawHistory(data.history);
    },
    onError: (error: Error) => {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${error.message}` }]);
    },
  });

  const aplicarMutation = useMutation({
    mutationFn: (propuesta: Propuesta) => asistenteApi.aplicarPropuesta(propuesta),
    onMutate: (propuesta) => setEstado(propuesta.id, { estado: "aplicando" }),
    onSuccess: (data, propuesta) => {
      setEstado(propuesta.id, { estado: "aplicada", mensaje: data.mensaje });
      // Los precios cambiaron: que las demás pantallas vuelvan a pedir los datos.
      queryClient.invalidateQueries();
    },
    onError: (error: Error, propuesta) =>
      setEstado(propuesta.id, { estado: "error", mensaje: error.message }),
  });

  return {
    messages,
    sendMessage: (text: string) => sendMutation.mutateAsync(text).catch(() => undefined),
    isSending: sendMutation.isPending,
    estados,
    aplicar: (propuesta: Propuesta) => aplicarMutation.mutate(propuesta),
    descartar: (propuesta: Propuesta) => setEstado(propuesta.id, { estado: "descartada" }),
  };
}
