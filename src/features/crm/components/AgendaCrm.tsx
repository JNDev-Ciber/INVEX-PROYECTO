import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatFechaLocal } from "@/shared/lib/date";
import { useAgendaCrm, useCompletarSeguimiento } from "../hooks/use-crm";
import { TIPOS_SEGUIMIENTO, linkWhatsApp } from "../lib/crm-format";

function mensajeError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : "";
  return msg.replace(/\s*\(code=.*\)$/, "") || fallback;
}

const VENTANAS: Array<{ dias: number; label: string }> = [
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
];

/**
 * Agenda de seguimientos con fecha. Permite elegir la ventana (7/30 días),
 * crear una tarea nueva ("+ Agendar") y marcar hecho o escribir por WhatsApp.
 */
export function AgendaCrm({
  onAbrirCliente,
  onAgendar,
}: {
  onAbrirCliente: (id: number) => void;
  onAgendar: () => void;
}) {
  const { toast } = useToast();
  const [dias, setDias] = useState(7);
  const [abierto, setAbierto] = useState(true);
  const { data: agenda = [], isLoading } = useAgendaCrm(dias);
  const completar = useCompletarSeguimiento();

  const vencidos = agenda.filter((t) => t.vencido).length;

  const marcarHecho = async (id: string) => {
    try {
      await completar.mutateAsync({ id, hecho: true });
    } catch (err) {
      toast({ title: mensajeError(err, "No se pudo actualizar"), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="flex min-w-0 items-center gap-2 text-left"
            aria-expanded={abierto}
          >
            <CalendarClock className="h-4 w-4 shrink-0" />
            <CardTitle className="text-sm font-semibold">Agenda</CardTitle>
            {vencidos > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {vencidos} vencido{vencidos !== 1 ? "s" : ""}
              </span>
            )}
            {abierto ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
          <Button size="sm" onClick={onAgendar} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Agendar
          </Button>
        </div>
        {abierto && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Próximos</span>
            {VENTANAS.map((v) => (
              <button
                key={v.dias}
                type="button"
                onClick={() => setDias(v.dias)}
                className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                  dias === v.dias
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      {abierto && (
        <CardContent>
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : agenda.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay nada pendiente en esta ventana. Tocá <span className="font-medium">Agendar</span> para
              programar una llamada o visita.
            </p>
          ) : (
            <ul className="divide-y">
              {agenda.map((t) => {
                const wa = linkWhatsApp(t.cliente_telefono);
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="Marcar como hecho"
                      disabled={completar.isPending}
                      onClick={() => marcarHecho(t.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onAbrirCliente(t.cliente_id)}
                    >
                      <p className="truncate text-sm">
                        <span className="font-medium">{t.cliente_nombre}</span>
                        <span className="text-muted-foreground"> · {TIPOS_SEGUIMIENTO[t.tipo]}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{t.texto}</p>
                    </button>
                    <span
                      className={`shrink-0 text-xs ${
                        t.vencido
                          ? "font-medium text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t.vencido ? "Vencido · " : ""}
                      {formatFechaLocal(t.fecha_programada, { day: "numeric", month: "short" })}
                    </span>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                        className="shrink-0"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
