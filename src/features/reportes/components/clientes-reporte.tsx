import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Contact, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardColapsable } from "@/features/reportes/components/CardColapsable";
import type { Segmento } from "@/mocks/crm";
import { useClientesCrm } from "@/features/crm/hooks/use-crm";
import { SEGMENTOS, formatPesos } from "@/features/crm/lib/crm-format";

const ORDEN: Segmento[] = ["frecuente", "nuevo", "ocasional", "inactivo", "sin_compras"];

const BARRA: Record<Segmento, string> = {
  frecuente: "bg-green-500",
  nuevo: "bg-blue-500",
  ocasional: "bg-slate-400",
  inactivo: "bg-orange-500",
  sin_compras: "bg-muted-foreground/30",
};

/** Clientes por segmento y los que más compran (datos del CRM). */
export function ClientesReporte() {
  const { data: clientes = [], isLoading, error } = useClientesCrm();

  const resumen = useMemo(() => {
    const totalComprado = clientes.reduce((s, c) => s + c.total_comprado, 0);
    const segmentos = ORDEN.map((seg) => {
      const del = clientes.filter((c) => c.segmento === seg);
      const monto = del.reduce((s, c) => s + c.total_comprado, 0);
      return {
        seg,
        cantidad: del.length,
        monto,
        participacion: totalComprado > 0 ? Math.round((monto / totalComprado) * 100) : 0,
      };
    });
    const mejores = [...clientes]
      .filter((c) => c.total_comprado > 0)
      .sort((a, b) => b.total_comprado - a.total_comprado)
      .slice(0, 5);
    const aRecontactar = clientes.filter((c) => c.segmento === "inactivo" && c.compras >= 2).length;
    return { totalComprado, segmentos, mejores, aRecontactar };
  }, [clientes]);

  const maxCantidad = Math.max(1, ...resumen.segmentos.map((s) => s.cantidad));

  return (
    <CardColapsable
      titulo="Clientes"
      icono={<Contact className="h-4 w-4 text-primary" />}
      acciones={
        <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs w-fit">
          <Link to="/clientes/crm">
            Abrir CRM
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No se pudieron cargar los clientes: {error instanceof Error ? error.message : "error desconocido"}
        </p>
      ) : clientes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Todavía no hay clientes cargados.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {clientes.length} clientes · compraron {formatPesos(resumen.totalComprado)} en total
            </p>
            <ul className="space-y-2.5">
              {resumen.segmentos.map((s) => (
                <li key={s.seg} className="space-y-1" title={SEGMENTOS[s.seg].descripcion}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>{SEGMENTOS[s.seg].label}</span>
                    <span className="tabular-nums text-muted-foreground text-xs">
                      <span className="font-semibold text-foreground text-sm">{s.cantidad}</span>
                      {s.seg !== "sin_compras" && ` · ${formatPesos(s.monto)} (${s.participacion}%)`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BARRA[s.seg]}`}
                      style={{ width: `${(s.cantidad / maxCantidad) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {resumen.aRecontactar > 0 && (
              <p className="text-xs text-orange-700 dark:text-orange-400">
                {resumen.aRecontactar} buen{resumen.aRecontactar === 1 ? " cliente dejó" : "os clientes dejaron"} de
                comprar hace más de 60 días.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">Los que más compran</p>
            {resumen.mejores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay compras con cliente.</p>
            ) : (
              <ol className="divide-y rounded-md border">
                {resumen.mejores.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-3 p-2.5 text-sm">
                    <span className="w-4 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.nombre}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.compras} compra{c.compras !== 1 ? "s" : ""}
                        {c.dias_sin_comprar != null && ` · última hace ${c.dias_sin_comprar} d`}
                      </p>
                    </div>
                    <Badge className={`${SEGMENTOS[c.segmento].clase} border-0 text-[11px] shrink-0`}>
                      {SEGMENTOS[c.segmento].label}
                    </Badge>
                    <span className="font-semibold tabular-nums shrink-0">{formatPesos(c.total_comprado)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </CardColapsable>
  );
}
