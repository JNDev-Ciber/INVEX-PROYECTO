import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeftRight,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  PackagePlus,
  Percent,
  RefreshCw,
  TrendingUp,
  UserRoundCheck,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAgente } from "@/features/asistente/hooks/use-agente";
import type { DecisionAgente, TipoDecision } from "@/mocks/asistente";

const ICONOS: Record<TipoDecision, typeof Bot> = {
  reponer: PackagePlus,
  descuento: Percent,
  precio: TrendingUp,
  cobrar: Wallet,
  transferir: ArrowLeftRight,
  recontactar: UserRoundCheck,
};

const COLORES: Record<TipoDecision, string> = {
  reponer: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  descuento: "text-red-600 bg-red-50 dark:bg-red-950/40",
  precio: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  cobrar: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  transferir: "text-orange-600 bg-orange-50 dark:bg-orange-950/40",
  recontactar: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
};

const BOTON_APROBAR: Record<TipoDecision, string> = {
  reponer: "Aprobar compra",
  descuento: "Aplicar descuento",
  precio: "Aplicar precio",
  cobrar: "Aprobar y abrir WhatsApp",
  transferir: "Aprobar y crear remito",
  recontactar: "Aprobar y abrir WhatsApp",
};

const ESTADOS: Record<string, string> = {
  aplicada: "Aplicada",
  completada: "Completada",
  rechazada: "Rechazada",
  aprobada: "Aprobada",
};

function haceCuanto(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
}

function PrioridadBadge({ prioridad }: { prioridad: DecisionAgente["prioridad"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase",
        prioridad === "alta" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        prioridad === "media" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        prioridad === "baja" && "bg-muted text-muted-foreground",
      )}
    >
      {prioridad}
    </span>
  );
}

function DecisionCard({
  decision,
  ocupado,
  onAprobar,
  onRechazar,
}: {
  decision: DecisionAgente;
  ocupado: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  const [abierta, setAbierta] = useState(true);
  const Icono = ICONOS[decision.tipo];
  // Cobrar y recontactar abren WhatsApp en el mismo click (si se abre después
  // de la respuesta, el navegador lo bloquea).
  const conMensaje = decision.tipo === "cobrar" || decision.tipo === "recontactar";
  const abreWhatsApp = conMensaje && decision.whatsapp_url;

  return (
    <div className="flex gap-3 rounded-lg border bg-background p-4 text-sm">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", COLORES[decision.tipo])}>
        <Icono className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <p className="font-medium">{decision.titulo}</p>
            <PrioridadBadge prioridad={decision.prioridad} />
          </div>
          <button
            onClick={() => setAbierta((v) => !v)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={abierta ? "Minimizar" : "Expandir"}
            aria-expanded={abierta}
          >
            {abierta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {abierta ? (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">{decision.detalle}</p>
            <p>{decision.motivo}</p>
            {decision.mensaje && (
              <div className="rounded-md bg-muted/60 p-2 text-xs">
                <p className="mb-0.5 flex items-center gap-1 font-medium text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  Mensaje para {decision.destinatario ?? "enviar"}
                </p>
                <p className="whitespace-pre-wrap">{decision.mensaje}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {abreWhatsApp ? (
                <Button size="sm" asChild disabled={ocupado} className="bg-green-600 hover:bg-green-700">
                  <a href={decision.whatsapp_url ?? undefined} target="_blank" rel="noreferrer" onClick={onAprobar}>
                    <MessageCircle className="mr-1 h-3.5 w-3.5" />
                    {BOTON_APROBAR[decision.tipo]}
                  </a>
                </Button>
              ) : (
                <Button size="sm" onClick={onAprobar} disabled={ocupado}>
                  {ocupado ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                  {conMensaje ? "Aprobar" : BOTON_APROBAR[decision.tipo]}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onRechazar} disabled={ocupado}>
                <X className="mr-1 h-3.5 w-3.5" />
                Rechazar
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 truncate text-xs text-muted-foreground">{decision.detalle}</p>
        )}
      </div>
    </div>
  );
}

function SeccionColapsable({
  titulo,
  cantidad,
  defaultOpen = true,
  children,
}: {
  titulo: string;
  cantidad?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">
          {titulo}
          {cantidad != null && cantidad > 0 && ` (${cantidad})`}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && children}
    </div>
  );
}

export function BandejaAgentePanel({ onCargarFactura }: { onCargarFactura: () => void }) {
  const {
    estado,
    cargando,
    errorEstado,
    revisar,
    revisando,
    errorRevision,
    resolver,
    resolviendoId,
    aviso,
    cerrarAviso,
  } = useAgente();
  const [verPasos, setVerPasos] = useState(false);
  const [verResumen, setVerResumen] = useState(true);

  if (cargando) {
    return (
      <Card className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando la bandeja del agente…
      </Card>
    );
  }
  if (errorEstado) return <p className="text-sm text-red-600">Bandeja del agente: {errorEstado}</p>;
  if (!estado) return null;
  if (!estado.configurado) {
    return (
      <p className="text-sm text-muted-foreground">
        Falta correr <code>sql/agente_ia.sql</code> en la base para activar el agente.
      </p>
    );
  }

  const revision = estado.ultima_revision;

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Bot className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">Agente del negocio</p>
              <p className="text-muted-foreground">
                Revisa solo, una vez por día, el stock, lo que se vende, los márgenes y las cuentas corrientes, y te deja
                decisiones listas para aprobar.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {revision
                  ? `Última revisión ${haceCuanto(revision.iniciada_en)} (${revision.origen === "automatica" ? "automática" : `pedida por ${revision.ejecutada_por ?? "el dueño"}`})`
                  : "Todavía no revisó el negocio."}
                {estado.proxima_automatica && ` · Próxima automática ${haceCuanto(estado.proxima_automatica)}`}
              </p>
            </div>
          </div>
          <Button onClick={revisar} disabled={revisando} className="shrink-0 bg-purple-600 hover:bg-purple-700">
            {revisando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            {revisando ? "Revisando…" : "Revisar ahora"}
          </Button>
        </div>

        {revisando && (
          <p className="rounded-md bg-purple-50 p-3 text-sm text-purple-800 dark:bg-purple-950/40 dark:text-purple-200">
            El agente está investigando: reposición, stock parado, márgenes, cobranzas y lo que ya le rechazaste. Tarda
            unos segundos…
          </p>
        )}
        {errorRevision && <p className="text-sm text-red-600">{errorRevision}</p>}

        {!revisando && revision && (
          <div className="space-y-2">
            {revision.estado === "error" ? (
              <p className="text-sm text-red-600">La última revisión falló: {revision.error}</p>
            ) : revision.resumen ? (
              <div className="rounded-md bg-muted/60 p-3 text-sm">
                <button
                  onClick={() => setVerResumen((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                  aria-expanded={verResumen}
                >
                  <span className="text-xs font-medium uppercase text-muted-foreground">Resumen del agente</span>
                  {verResumen ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {verResumen && <p className="mt-1 whitespace-pre-wrap">{revision.resumen}</p>}
              </div>
            ) : null}

            {revision.pasos.length > 0 && (
              <div className="text-sm">
                <button
                  onClick={() => setVerPasos((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {verPasos ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Qué hizo el agente ({revision.pasos.length} pasos)
                </button>
                {verPasos && (
                  <ol className="mt-2 space-y-1 border-l pl-4">
                    {revision.pasos.map((paso, i) => (
                      <li key={i} className="text-xs">
                        <span className="font-medium">{paso.herramienta}:</span>{" "}
                        <span className="text-muted-foreground">{paso.resultado}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {aviso && (
        <div
          className={cn(
            "flex items-start justify-between gap-2 rounded-md border p-3 text-sm",
            aviso.error ? "border-red-200 text-red-700" : "border-green-200 text-green-700",
          )}
        >
          <div>
            <p className="font-medium">{aviso.titulo}</p>
            <p>{aviso.mensaje}</p>
            {aviso.whatsapp_url && (
              <a href={aviso.whatsapp_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 underline">
                <MessageCircle className="h-3.5 w-3.5" />
                Abrir WhatsApp
              </a>
            )}
          </div>
          <button onClick={cerrarAviso} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <SeccionColapsable titulo="Decisiones pendientes" cantidad={estado.pendientes.length}>
        {estado.pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {revision ? "No hay decisiones pendientes." : "Tocá “Revisar ahora” para que el agente haga la primera revisión."}
          </p>
        ) : (
          estado.pendientes.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              ocupado={resolviendoId === d.id}
              onAprobar={() => resolver(d, "aprobar")}
              onRechazar={() => resolver(d, "rechazar")}
            />
          ))
        )}
      </SeccionColapsable>

      {estado.para_comprar.length > 0 && (
        <Card className="p-4 text-sm">
          <SeccionColapsable titulo="Para comprar" cantidad={estado.para_comprar.length} defaultOpen={false}>
          {estado.para_comprar.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
              <div className="min-w-0">
                <p className="font-medium">{d.titulo}</p>
                {d.destinatario && <p className="text-xs text-muted-foreground">Proveedor: {d.destinatario}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {d.whatsapp_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={d.whatsapp_url} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-1 h-3.5 w-3.5" />
                      Pedir por WhatsApp
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={onCargarFactura}>
                  <Camera className="mr-1 h-3.5 w-3.5" />
                  Cargar factura
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resolver(d, "completar")} disabled={resolviendoId === d.id}>
                  Ya lo compré
                </Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Al cargar la factura con foto, estas compras se marcan solas como hechas.</p>
          </SeccionColapsable>
        </Card>
      )}

      {estado.recientes.length > 0 && (
        <SeccionColapsable titulo="Resueltas en los últimos 7 días" defaultOpen={false}>
          <div className="space-y-1 text-sm">
          {estado.recientes.map((d) => (
            <div key={d.id} className="flex items-center gap-2 text-xs">
              {d.estado === "rechazada" ? (
                <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
              )}
              <span className={cn(d.estado === "rechazada" && "text-muted-foreground line-through")}>{d.titulo}</span>
              <span className="text-muted-foreground">
                · {ESTADOS[d.estado] ?? d.estado}
                {d.resuelta_por && ` por ${d.resuelta_por}`}
                {d.resuelta_en && ` ${haceCuanto(d.resuelta_en)}`}
              </span>
            </div>
          ))}
          </div>
        </SeccionColapsable>
      )}
    </div>
  );
}
