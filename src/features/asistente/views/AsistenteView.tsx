import { useEffect, useState } from "react";
import { Bot, Camera, Check, FileText, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAsistente, type EstadoPropuesta } from "@/features/asistente/hooks/use-asistente";
import { useAgente } from "@/features/asistente/hooks/use-agente";
import { getCupoIa, type CupoIa, type Propuesta } from "@/mocks/asistente";
import { OfertasSemanaPanel } from "@/features/asistente/components/OfertasSemanaPanel";
import { BandejaAgentePanel } from "@/features/asistente/components/BandejaAgentePanel";
import { FacturaFotoPanel } from "@/features/asistente/components/FacturaFotoPanel";

const REPORTE_SEMANAL = "Armá el reporte semanal";

const SUGERENCIAS = [
  "¿Qué puedo poner en oferta?",
  "¿Qué productos tienen margen bajo?",
  "¿Qué tengo que reponer pronto?",
  "¿Qué fue lo más vendido en los últimos 30 días?",
  "¿Cuánta plata tengo parada en productos sin ventas?",
  "¿Conviene ajustar los precios de alguna categoría?",
];

type Pestana = "bandeja" | "factura" | "chat";

function PropuestaCard({
  propuesta,
  estado,
  onAplicar,
  onDescartar,
}: {
  propuesta: Propuesta;
  estado?: EstadoPropuesta;
  onAplicar: () => void;
  onDescartar: () => void;
}) {
  const actual = estado?.estado ?? "pendiente";

  return (
    <div className="rounded-md border bg-background p-3 text-sm">
      <p className="font-medium">{propuesta.titulo}</p>
      <p className="text-muted-foreground">{propuesta.detalle}</p>
      {propuesta.motivo && <p className="mt-1 text-xs text-muted-foreground">{propuesta.motivo}</p>}

      <div className="mt-2 flex items-center gap-2">
        {(actual === "pendiente" || actual === "error") && (
          <>
            <Button size="sm" onClick={onAplicar}>
              <Check className="mr-1 h-3.5 w-3.5" />
              Aplicar
            </Button>
            <Button size="sm" variant="outline" onClick={onDescartar}>
              <X className="mr-1 h-3.5 w-3.5" />
              Descartar
            </Button>
          </>
        )}
        {actual === "aplicando" && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Aplicando…
          </span>
        )}
        {actual === "aplicada" && <span className="text-green-600">✓ {estado?.mensaje ?? "Aplicado"}</span>}
        {actual === "descartada" && <span className="text-muted-foreground">Descartada</span>}
      </div>
      {actual === "error" && <p className="mt-1 text-xs text-red-600">{estado?.mensaje}</p>}
    </div>
  );
}

function CupoBadge({ cupo }: { cupo: CupoIa | null }) {
  if (!cupo || cupo.cupo <= 0) return null;
  const restantes = Math.max(0, cupo.cupo - cupo.usados);
  const bajo = restantes <= Math.max(5, Math.ceil(cupo.cupo * 0.1));
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs tabular-nums",
        restantes === 0
          ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          : bajo
            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
            : "text-muted-foreground"
      )}
      title="Consultas de IA usadas este mes. Se renueva el día 1."
    >
      IA: {cupo.usados}/{cupo.cupo} este mes
    </span>
  );
}

export default function AsistenteView() {
  const { messages, sendMessage, isSending, estados, aplicar, descartar } = useAsistente();
  const { estado: estadoAgente } = useAgente();
  const [input, setInput] = useState("");
  const [pestana, setPestana] = useState<Pestana>("bandeja");
  const [cupo, setCupo] = useState<CupoIa | null>(null);
  const pendientes = estadoAgente?.pendientes.length ?? 0;

  const refrescarCupo = () => {
    void getCupoIa().then(setCupo);
  };

  useEffect(() => {
    refrescarCupo();
  }, []);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setPestana("chat");
    setInput("");
    await sendMessage(trimmed);
    refrescarCupo();
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-semibold">Asistente IA</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Un agente que revisa el negocio solo, carga de mercadería con foto y un asesor para consultar. Nada se aplica sin tu
            aprobación.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => handleSend(REPORTE_SEMANAL)} disabled={isSending}>
            <FileText className="mr-1 h-4 w-4" />
            Reporte semanal
          </Button>
          <CupoBadge cupo={cupo} />
        </div>
      </div>

      <OfertasSemanaPanel />

      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          <TabsTrigger value="bandeja" className="gap-1.5">
            <Bot className="h-4 w-4" />
            Bandeja del agente
            {pendientes > 0 && (
              <span className="rounded-full bg-purple-600 px-1.5 text-[11px] font-semibold text-white">{pendientes}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="factura" className="gap-1.5">
            <Camera className="h-4 w-4" />
            Cargar factura con foto
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Chat con el asesor
          </TabsTrigger>
        </TabsList>

        {/* forceMount: al cambiar de pestaña no se pierde lo que se estaba cargando. */}
        <TabsContent value="bandeja" forceMount className="data-[state=inactive]:hidden">
          <BandejaAgentePanel onCargarFactura={() => setPestana("factura")} />
        </TabsContent>

        <TabsContent value="factura" forceMount className="data-[state=inactive]:hidden">
          <FacturaFotoPanel />
        </TabsContent>

        <TabsContent value="chat" forceMount className="min-h-[420px] flex-1 flex-col data-[state=active]:flex data-[state=inactive]:hidden">
          <Card className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">Probá preguntando, por ejemplo:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGERENCIAS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="rounded-full border px-3 py-1.5 text-sm text-left hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn("flex max-w-[85%] flex-col gap-2", m.role === "user" ? "self-end" : "self-start")}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                      >
                        {m.content}
                      </div>
                      {m.propuestas?.map((p) => (
                        <PropuestaCard
                          key={p.id}
                          propuesta={p}
                          estado={estados[p.id]}
                          onAplicar={() => aplicar(p)}
                          onDescartar={() => descartar(p)}
                        />
                      ))}
                    </div>
                  ))}
                  {isSending && (
                    <div className="self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Analizando…
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="flex items-end gap-2 border-t p-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Escribí tu pregunta..."
                className="min-h-[44px] resize-none"
                rows={1}
                disabled={isSending}
              />
              <Button onClick={() => handleSend(input)} disabled={isSending || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
