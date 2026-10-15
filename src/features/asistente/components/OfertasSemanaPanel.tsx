import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Loader2, RefreshCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOfertasSemana } from "@/features/asistente/hooks/use-ofertas-semana";
import type { OfertaPropuesta, PropuestaOfertas } from "@/mocks/asistente";

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fechaCorta = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function formatearFecha(iso: string) {
  return fechaCorta.format(new Date(`${iso}T00:00:00Z`));
}

function claveNoAhora(semanaInicio: string) {
  return `invex-ofertas-semana-no-${semanaInicio}`;
}

function leerNoAhora(semanaInicio: string) {
  try {
    return localStorage.getItem(claveNoAhora(semanaInicio)) === "1";
  } catch {
    return false;
  }
}

function guardarNoAhora(semanaInicio: string) {
  try {
    localStorage.setItem(claveNoAhora(semanaInicio), "1");
  } catch {
    // Sin localStorage: el cartel vuelve a aparecer la próxima vez, no pasa nada.
  }
}

function detalleVentas(o: OfertaPropuesta) {
  const sinVenta =
    o.dias_sin_venta === null ? "nunca se vendió" : o.dias_sin_venta > 0 ? `${o.dias_sin_venta} días sin venta` : "vendido hoy";
  return `Margen ${o.margen_actual}% → ${o.margen_oferta}% · Stock ${o.stock} · ${o.vendidas_30_dias} vendidas en 30 días · ${sinVenta}`;
}

function PropuestaCard({
  propuesta,
  cantidadVigentes,
  publicando,
  error,
  onPublicar,
  onRegenerar,
  onDescartar,
}: {
  propuesta: PropuestaOfertas;
  cantidadVigentes: number;
  publicando: boolean;
  error?: string;
  onPublicar: (ofertas: OfertaPropuesta[]) => void;
  onRegenerar: () => void;
  onDescartar: () => void;
}) {
  const [excluidas, setExcluidas] = useState<Set<string>>(new Set());
  const seleccionadas = propuesta.ofertas.filter((o) => !excluidas.has(o.producto_id));

  const alternar = (id: string) =>
    setExcluidas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold">
          <Tag className="h-4 w-4 text-red-600" />
          Propuesta de ofertas
        </p>
        <span className="text-xs text-muted-foreground">
          Semana del {formatearFecha(propuesta.semana.inicio)} al {formatearFecha(propuesta.semana.fin)}
        </span>
      </div>

      <div className="rounded-md bg-muted/60 p-3 text-sm">
        <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Por qué estas ofertas esta semana</p>
        <p className="whitespace-pre-wrap">{propuesta.resumen}</p>
      </div>

      <div className="space-y-2">
        {propuesta.ofertas.map((o) => {
          const incluida = !excluidas.has(o.producto_id);
          return (
            <label
              key={o.producto_id}
              className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm ${incluida ? "" : "opacity-50"}`}
            >
              <input
                type="checkbox"
                checked={incluida}
                onChange={() => alternar(o.producto_id)}
                disabled={publicando}
                className="mt-1 h-4 w-4 accent-red-600"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {o.nombre} <span className="text-xs font-normal text-muted-foreground">· {o.categoria}</span>
                  </span>
                  <span className="font-semibold text-red-600">
                    -{o.porcentaje}% · {pesos.format(o.precio_oferta)}{" "}
                    <span className="text-xs font-normal text-muted-foreground line-through">
                      {pesos.format(o.precio_lista)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{detalleVentas(o)}</p>
                <p className="mt-1">{o.motivo}</p>
              </div>
            </label>
          );
        })}
      </div>

      {cantidadVigentes > 0 && (
        <p className="text-xs text-amber-600">
          Al publicar se reemplazan las {cantidadVigentes} ofertas que hoy están en el carrusel.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onPublicar(seleccionadas)}
          disabled={publicando || seleccionadas.length === 0}
          className="bg-red-600 hover:bg-red-700"
        >
          {publicando && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Publicar {seleccionadas.length} {seleccionadas.length === 1 ? "oferta" : "ofertas"} en el carrusel
        </Button>
        <Button variant="outline" onClick={onRegenerar} disabled={publicando}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Volver a generar
        </Button>
        <Button variant="ghost" onClick={onDescartar} disabled={publicando}>
          Descartar
        </Button>
      </div>
    </Card>
  );
}

export function OfertasSemanaPanel() {
  const {
    estado,
    cargando,
    errorEstado,
    propuesta,
    proponiendo,
    errorPropuesta,
    proponer,
    descartarPropuesta,
    publicar,
    publicando,
    errorPublicar,
    mensajePublicar,
    retirar,
    retirando,
    errorRetirar,
  } = useOfertasSemana();
  const [noAhora, setNoAhora] = useState<string | null>(null);
  const [verVigentes, setVerVigentes] = useState(false);

  if (cargando) return null;
  if (errorEstado) return <p className="text-xs text-red-600">Ofertas de la semana: {errorEstado}</p>;
  if (!estado) return null;
  if (!estado.configurada) {
    return (
      <p className="text-xs text-muted-foreground">
        Ofertas de la semana: falta correr <code>sql/ofertas_semana.sql</code> en la base.
      </p>
    );
  }

  const semanaTexto = `${formatearFecha(estado.semana.inicio)} al ${formatearFecha(estado.semana.fin)}`;
  const mostrarCartel =
    !estado.publicadas_esta_semana && noAhora !== estado.semana.inicio && !leerNoAhora(estado.semana.inicio);

  if (proponiendo) {
    return (
      <Card className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analizando ventas, stock parado, márgenes y fechas cercanas para armar las ofertas…
      </Card>
    );
  }

  if (propuesta) {
    return (
      <PropuestaCard
        key={propuesta.resumen}
        propuesta={propuesta}
        cantidadVigentes={estado.vigentes.length}
        publicando={publicando}
        error={errorPublicar}
        onPublicar={(ofertas) =>
          publicar({
            resumen: propuesta.resumen,
            ofertas: ofertas.map((o) => ({ producto_id: o.producto_id, porcentaje: o.porcentaje, motivo: o.motivo })),
          })
        }
        onRegenerar={proponer}
        onDescartar={descartarPropuesta}
      />
    );
  }

  return (
    <div className="space-y-2">
      {mensajePublicar && <p className="text-sm text-green-600">✓ {mensajePublicar}</p>}

      {mostrarCartel && (
        <Card className="flex flex-col gap-3 border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-4 w-4 text-purple-600" />
              ¿Te gustaría que cree ofertas para esta semana?
            </p>
            <p className="text-muted-foreground">
              Semana del {semanaTexto}. Analizo ventas, stock parado, márgenes y fechas cercanas, y te propongo 5 ofertas
              para el carrusel de la tienda con el porqué de cada una. Nada se publica hasta que lo apruebes.
            </p>
            {estado.vigentes.length > 0 && estado.semana_vigentes && (
              <p className="text-xs text-muted-foreground">
                Hoy el carrusel muestra {estado.vigentes.length} ofertas publicadas la semana del{" "}
                {formatearFecha(estado.semana_vigentes)}.
              </p>
            )}
            {errorPropuesta && <p className="text-xs text-red-600">{errorPropuesta}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={proponer} className="bg-purple-600 hover:bg-purple-700">
              Sí, crear ofertas
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                guardarNoAhora(estado.semana.inicio);
                setNoAhora(estado.semana.inicio);
              }}
            >
              Ahora no
            </Button>
          </div>
        </Card>
      )}

      {estado.vigentes.length > 0 && (
        <Card className="p-3 text-sm">
          <button
            onClick={() => setVerVigentes((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2 font-medium">
              <Tag className="h-4 w-4 text-red-600" />
              Ofertas en el carrusel ({estado.vigentes.length})
              {estado.semana_vigentes && (
                <span className="font-normal text-muted-foreground">
                  · publicadas la semana del {formatearFecha(estado.semana_vigentes)}
                </span>
              )}
            </span>
            {verVigentes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {verVigentes && (
            <div className="mt-3 space-y-2">
              {estado.resumen && (
                <div className="rounded-md bg-muted/60 p-3">
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Por qué se eligieron</p>
                  <p className="whitespace-pre-wrap">{estado.resumen}</p>
                </div>
              )}
              {estado.vigentes.map((o) => (
                <div key={o.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {o.nombre} · <span className="text-red-600">-{o.porcentaje}% {pesos.format(o.precio_oferta)}</span>{" "}
                      <span className="text-xs font-normal text-muted-foreground line-through">
                        {pesos.format(o.precio_lista)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Margen {o.margen_oferta}% · Stock {o.stock}
                    </p>
                    {o.motivo && <p className="mt-1">{o.motivo}</p>}
                  </div>
                  <Button size="sm" variant="outline" disabled={retirando} onClick={() => retirar(o.id)}>
                    Retirar
                  </Button>
                </div>
              ))}
              {errorRetirar && <p className="text-xs text-red-600">{errorRetirar}</p>}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retirando}
                  onClick={() => {
                    if (window.confirm("¿Retirar todas las ofertas del carrusel? Los productos vuelven a su precio anterior.")) {
                      retirar();
                    }
                  }}
                >
                  {retirando && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Retirar todas
                </Button>
                {!mostrarCartel && (
                  <Button size="sm" variant="ghost" onClick={proponer}>
                    Crear nuevas ofertas
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {!mostrarCartel && estado.vigentes.length === 0 && (
        <Button size="sm" variant="ghost" onClick={proponer} className="text-muted-foreground">
          <CalendarDays className="mr-1 h-4 w-4" />
          Crear ofertas de la semana
        </Button>
      )}
    </div>
  );
}
