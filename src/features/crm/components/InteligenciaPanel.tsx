import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ClienteLista, CrmInteligencia } from "@/mocks/crm";
import { useAnalizarCrmIa, useCrmInteligencia } from "../hooks/use-crm";
import { SEGMENTOS, formatPesos, linkWhatsApp } from "../lib/crm-format";

const AGING_LABEL: Record<string, string> = {
  "0_30": "0–30 días",
  "31_60": "31–60 días",
  "61_90": "61–90 días",
  mas_90: "+90 días",
};
const AGING_ORDEN = ["0_30", "31_60", "61_90", "mas_90"];
const AGING_TONO: Record<string, string> = {
  "0_30": "bg-emerald-500",
  "31_60": "bg-amber-500",
  "61_90": "bg-orange-500",
  mas_90: "bg-red-500",
};

const nf = new Intl.NumberFormat("es-AR");

export function InteligenciaPanel({ onAbrirCliente }: { onAbrirCliente?: (id: number) => void }) {
  const { toast } = useToast();
  const { data, isLoading, isError } = useCrmInteligencia();
  const analizar = useAnalizarCrmIa();
  const [analisis, setAnalisis] = useState<string | null>(null);

  const correrIa = async () => {
    try {
      const texto = await analizar.mutateAsync();
      setAnalisis(texto || "La IA no devolvió texto. Probá de nuevo.");
    } catch (err) {
      setAnalisis(null);
      toast({
        title: err instanceof Error ? err.message.replace(/\s*\(code=.*\)$/, "") : "No se pudo analizar",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Inteligencia del negocio
          </CardTitle>
          <CardDescription className="text-xs">
            Datos, marketing y finanzas a partir de tus clientes y ventas
          </CardDescription>
        </div>
        <Button size="sm" onClick={correrIa} disabled={analizar.isPending || isLoading || !data}>
          {analizar.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Analizar con IA
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {analisis && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-900/50 dark:bg-violet-950/30">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <Sparkles className="h-3.5 w-3.5" />
                Análisis con IA
              </span>
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => setAnalisis(null)}
              >
                Ocultar
              </button>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{analisis}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No se pudo cargar la inteligencia del negocio.
          </p>
        ) : (
          <div className="space-y-2.5">
            <SeccionDatos data={data} onAbrirCliente={onAbrirCliente} />
            <SeccionMarketing data={data} onAbrirCliente={onAbrirCliente} />
            <SeccionFinanzas data={data} onAbrirCliente={onAbrirCliente} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Bloques
// ---------------------------------------------------------------------

function Seccion({
  titulo,
  descripcion,
  icono,
  defaultOpen,
  children,
}: {
  titulo: string;
  descripcion: string;
  icono: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-2 p-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {icono}
            {titulo}
          </div>
          <p className="text-xs text-muted-foreground">{descripcion}</p>
        </div>
        {open ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && <div className="space-y-4 border-t p-3">{children}</div>}
    </div>
  );
}

function Kpi({ label, valor, tono }: { label: string; valor: string; tono?: string }) {
  return (
    <div className="rounded-md border p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-base font-semibold ${tono ?? ""}`}>{valor}</p>
    </div>
  );
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>;
}

function ClienteRow({
  c,
  derecha,
  onAbrir,
}: {
  c: ClienteLista;
  derecha: ReactNode;
  onAbrir?: (id: number) => void;
}) {
  const wa = linkWhatsApp(c.telefono);
  return (
    <li className="flex items-center gap-2 py-2">
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={onAbrir ? () => onAbrir(c.id) : undefined}
      >
        <p className="truncate text-sm font-medium">{c.nombre}</p>
        <p className="truncate text-xs text-muted-foreground">{c.telefono || "Sin teléfono"}</p>
      </button>
      <div className="shrink-0 text-right text-xs">{derecha}</div>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="shrink-0">
          <MessageCircle className="h-4 w-4 text-green-600" />
        </a>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------

function SeccionDatos({
  data,
  onAbrirCliente,
}: {
  data: CrmInteligencia;
  onAbrirCliente?: (id: number) => void;
}) {
  const d = data.datos;
  const maxIngreso = Math.max(1, ...d.tendencia_mensual.map((m) => Number(m.ingreso) || 0));
  const totalSeg = Object.values(d.segmentos).reduce((a, b) => a + (Number(b) || 0), 0) || 1;

  return (
    <Seccion
      titulo="Datos"
      descripcion="Cómo está tu cartera de clientes y de dónde sale la facturación: KPIs, segmentos, tus mejores clientes y la evolución mes a mes."
      icono={<BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Ingreso total" valor={formatPesos(Number(d.ingreso_total) || 0)} />
        <Kpi label="Ticket promedio" valor={formatPesos(Number(d.ticket_promedio) || 0)} />
        <Kpi label="Clientes con compras" valor={nf.format(d.con_compras)} />
        <Kpi label="Nuevos (30 días)" valor={nf.format(d.nuevos_30)} tono="text-blue-600 dark:text-blue-400" />
      </div>

      <div className="space-y-2">
        <Subtitulo>Segmentos</Subtitulo>
        <div className="space-y-1.5">
          {Object.entries(d.segmentos)
            .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
            .map(([seg, n]) => {
              const pct = Math.round((100 * (Number(n) || 0)) / totalSeg);
              return (
                <div key={seg} className="flex items-center gap-2 text-xs">
                  <span className="w-24 shrink-0">{SEGMENTOS[seg as keyof typeof SEGMENTOS]?.label ?? seg}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-muted-foreground">
                    {nf.format(Number(n) || 0)} · {pct}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="space-y-2">
        <Subtitulo>
          Top clientes · el Pareto: {nf.format(d.pareto_80_clientes)} de {nf.format(d.con_compras)} clientes hacen el
          80% del ingreso
        </Subtitulo>
        {d.top_clientes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin compras todavía.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {d.top_clientes.map((c) => (
              <li key={c.id} className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={onAbrirCliente ? () => onAbrirCliente(c.id) : undefined}
                >
                  <p className="truncate text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {nf.format(c.compras)} compra{c.compras !== 1 ? "s" : ""} · {c.pct}% del total
                  </p>
                </button>
                <span className="shrink-0 text-sm font-semibold">{formatPesos(Number(c.total) || 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {d.tendencia_mensual.length > 0 && (
        <div className="space-y-2">
          <Subtitulo>Ingreso por mes</Subtitulo>
          <div className="flex items-end gap-1.5">
            {d.tendencia_mensual.map((m) => {
              const alto = Math.max(4, Math.round((100 * (Number(m.ingreso) || 0)) / maxIngreso));
              return (
                <div key={m.mes} className="flex flex-1 flex-col items-center gap-1" title={`${m.mes}: ${formatPesos(Number(m.ingreso) || 0)}`}>
                  <div className="flex h-24 w-full items-end">
                    <div className="w-full rounded-t bg-blue-500/80" style={{ height: `${alto}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{m.mes.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Seccion>
  );
}

// ---------------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------------

function ListaClientes({
  titulo,
  clientes,
  derecha,
  vacio,
  onAbrir,
}: {
  titulo: string;
  clientes: ClienteLista[];
  derecha: (c: ClienteLista) => ReactNode;
  vacio: string;
  onAbrir?: (id: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Subtitulo>
        {titulo} ({clientes.length})
      </Subtitulo>
      {clientes.length === 0 ? (
        <p className="text-xs text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="divide-y rounded-md border px-3">
          {clientes.map((c) => (
            <ClienteRow key={c.id} c={c} derecha={derecha(c)} onAbrir={onAbrir} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SeccionMarketing({
  data,
  onAbrirCliente,
}: {
  data: CrmInteligencia;
  onAbrirCliente?: (id: number) => void;
}) {
  const m = data.marketing;
  return (
    <Seccion
      titulo="Marketing"
      descripcion="A quién contactar para vender más: clientes para reactivar, premiar o rescatar, y qué productos engancharles."
      icono={<TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />}
    >
      <ListaClientes
        titulo="Reactivar (inactivos que ya compraron)"
        clientes={m.reactivar}
        vacio="No hay inactivos para reactivar."
        onAbrir={onAbrirCliente}
        derecha={(c) => (
          <>
            <span className="font-medium">{formatPesos(Number(c.total_comprado) || 0)}</span>
            <p className="text-muted-foreground">{c.dias_sin_comprar ?? "?"} días sin comprar</p>
          </>
        )}
      />
      <ListaClientes
        titulo="Fidelizar (frecuentes)"
        clientes={m.fidelizar}
        vacio="Todavía no hay clientes frecuentes."
        onAbrir={onAbrirCliente}
        derecha={(c) => (
          <>
            <span className="font-medium">{formatPesos(Number(c.total_comprado) || 0)}</span>
            <p className="text-muted-foreground">{nf.format(c.compras_90_dias ?? 0)} en 90 días</p>
          </>
        )}
      />
      <ListaClientes
        titulo="En riesgo (se están enfriando)"
        clientes={m.en_riesgo}
        vacio="Ningún cliente en la zona de riesgo."
        onAbrir={onAbrirCliente}
        derecha={(c) => <p className="text-muted-foreground">{c.dias_sin_comprar ?? "?"} días sin comprar</p>}
      />

      <div className="space-y-1.5">
        <Subtitulo>Productos con más compradores (cross-sell)</Subtitulo>
        {m.cross_sell.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin datos de productos todavía.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {m.cross_sell.map((p) => (
              <li key={p.producto} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="truncate">{p.producto}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {nf.format(p.compradores)} cliente{p.compradores !== 1 ? "s" : ""} · {nf.format(p.unidades)} u.
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Seccion>
  );
}

// ---------------------------------------------------------------------
// Finanzas
// ---------------------------------------------------------------------

function SeccionFinanzas({
  data,
  onAbrirCliente,
}: {
  data: CrmInteligencia;
  onAbrirCliente?: (id: number) => void;
}) {
  const f = data.finanzas;
  const totalAging = AGING_ORDEN.reduce((a, k) => a + (Number(f.aging[k]?.monto) || 0), 0) || 1;
  const maxSucursal = Math.max(1, ...f.por_sucursal.map((s) => Number(s.ingreso) || 0));

  return (
    <Seccion
      titulo="Finanzas"
      descripcion="El estado del dinero por cobrar: cuánto te deben, hace cuánto, quiénes y de qué sucursal viene la facturación."
      icono={<Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi
          label="Deuda total"
          valor={formatPesos(Number(f.deuda_total) || 0)}
          tono={Number(f.deuda_total) > 0 ? "text-red-600 dark:text-red-400" : ""}
        />
        <Kpi label="Clientes que deben" valor={nf.format(f.clientes_con_deuda)} />
        <Kpi label="Top 5 clientes" valor={`${f.concentracion.top5_pct}%`} />
        <Kpi label="Top 10 clientes" valor={`${f.concentracion.top10_pct}%`} />
      </div>

      <div className="space-y-2">
        <Subtitulo>Antigüedad de la deuda</Subtitulo>
        {Object.keys(f.aging).length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay deuda pendiente. 🎉</p>
        ) : (
          <div className="space-y-1.5">
            {AGING_ORDEN.filter((k) => f.aging[k]).map((k) => {
              const monto = Number(f.aging[k].monto) || 0;
              const pct = Math.round((100 * monto) / totalAging);
              return (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0">{AGING_LABEL[k] ?? k}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${AGING_TONO[k] ?? "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right font-medium">{formatPesos(monto)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ListaClientes
        titulo="Prioridad de cobro"
        clientes={f.deudores.map((x) => ({
          id: x.id,
          nombre: x.nombre,
          telefono: x.telefono,
          total_comprado: 0,
          dias_sin_comprar: x.dias_sin_comprar,
          saldo_pendiente: x.saldo,
        }))}
        vacio="Nadie debe plata."
        onAbrir={onAbrirCliente}
        derecha={(c) => (
          <>
            <span className="font-medium text-red-600 dark:text-red-400">
              {formatPesos(Number(c.saldo_pendiente) || 0)}
            </span>
            <p className="text-muted-foreground">{c.dias_sin_comprar ?? "?"} días sin comprar</p>
          </>
        )}
      />

      {f.por_sucursal.length > 0 && (
        <div className="space-y-2">
          <Subtitulo>Ingreso por sucursal</Subtitulo>
          <div className="space-y-1.5">
            {f.por_sucursal.map((s) => {
              const pct = Math.round((100 * (Number(s.ingreso) || 0)) / maxSucursal);
              return (
                <div key={s.sucursal} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 truncate">{s.sucursal}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right font-medium">{formatPesos(Number(s.ingreso) || 0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Seccion>
  );
}
