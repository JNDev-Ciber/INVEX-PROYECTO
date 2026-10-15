import { useMemo, useState } from "react";
import { Contact, Loader2, MessageCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/app/stores";
import { esAdmin } from "@/shared/lib/roles";
import { formatFechaLocal } from "@/shared/lib/date";
import type { Segmento } from "@/mocks/crm";
import { ClienteFicha } from "../components/ClienteFicha";
import { InteligenciaPanel } from "../components/InteligenciaPanel";
import { ContactarHoy } from "../components/ContactarHoy";
import { AgendaCrm } from "../components/AgendaCrm";
import { NuevaTareaDialog, type AgendarState } from "../components/NuevaTareaDialog";
import { useClientesCrm } from "../hooks/use-crm";
import { SEGMENTOS, formatPesos, linkWhatsApp } from "../lib/crm-format";

type Filtro = Segmento | "todos" | "con_deuda";
type Orden = "nombre" | "mas_comprado" | "ultima_compra" | "mayor_deuda";

const ORDENES: Record<Orden, string> = {
  nombre: "Nombre (A–Z)",
  mas_comprado: "Más comprado",
  ultima_compra: "Compra más reciente",
  mayor_deuda: "Mayor deuda",
};

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export default function CrmView() {
  const rol = useAuthStore((s) => s.user?.rol);
  const { data: clientes = [], isLoading } = useClientesCrm();

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [etiqueta, setEtiqueta] = useState("todas");
  const [orden, setOrden] = useState<Orden>("nombre");
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [agendar, setAgendar] = useState<AgendarState>({ open: false });

  const abrirAgenda = (cliente?: { id: number; nombre: string }, texto?: string) =>
    setAgendar({ open: true, cliente, texto });

  const etiquetas = useMemo(
    () => Array.from(new Set(clientes.flatMap((c) => c.etiquetas))).sort(),
    [clientes]
  );

  const conteo = useMemo(() => {
    const porSegmento: Record<string, number> = {};
    for (const c of clientes) porSegmento[c.segmento] = (porSegmento[c.segmento] ?? 0) + 1;
    return {
      ...porSegmento,
      con_deuda: clientes.filter((c) => c.saldo_pendiente > 0).length,
    } as Record<Filtro, number>;
  }, [clientes]);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda);
    const qDigitos = busqueda.replace(/\D/g, "");
    return clientes.filter((c) => {
      if (filtro === "con_deuda" ? c.saldo_pendiente <= 0 : filtro !== "todos" && c.segmento !== filtro) {
        return false;
      }
      if (etiqueta !== "todas" && !c.etiquetas.includes(etiqueta)) return false;
      if (!q) return true;
      return (
        normalizar(c.nombre).includes(q) ||
        (qDigitos.length >= 3 &&
          ((c.telefono ?? "").replace(/\D/g, "").includes(qDigitos) ||
            (c.cuit ?? "").replace(/\D/g, "").includes(qDigitos)))
      );
    });
  }, [clientes, busqueda, filtro, etiqueta]);

  const ordenados = useMemo(() => {
    const arr = [...filtrados];
    switch (orden) {
      case "mas_comprado":
        return arr.sort((a, b) => b.total_comprado - a.total_comprado);
      case "ultima_compra":
        // Compra más reciente primero; los que nunca compraron, al final.
        return arr.sort((a, b) => (a.dias_sin_comprar ?? Infinity) - (b.dias_sin_comprar ?? Infinity));
      case "mayor_deuda":
        return arr.sort((a, b) => b.saldo_pendiente - a.saldo_pendiente);
      default:
        return arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
  }, [filtrados, orden]);

  // El cliente abierto sale del listado: así la ficha se actualiza al guardar.
  const seleccionado = clientes.find((c) => c.id === seleccionadoId) ?? null;

  if (!esAdmin(rol)) {
    return <p className="text-sm text-muted-foreground">Solo el dueño o caja pueden ver el CRM.</p>;
  }

  const tarjetas: Array<{ filtro: Filtro; label: string; clase: string }> = [
    { filtro: "frecuente", label: "Frecuentes", clase: "text-green-600 dark:text-green-400" },
    { filtro: "nuevo", label: "Nuevos", clase: "text-blue-600 dark:text-blue-400" },
    { filtro: "inactivo", label: "Inactivos", clase: "text-orange-600 dark:text-orange-400" },
    { filtro: "con_deuda", label: "Con deuda", clase: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Contact className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold">CRM de clientes</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Quién necesita un llamado hoy, el historial de cada cliente y el seguimiento de la agenda
        </p>
      </div>

      {/* Acción primero: a quién contactar hoy */}
      <ContactarHoy clientes={clientes} onAbrirCliente={setSeleccionadoId} onAgendar={abrirAgenda} />

      {/* Agenda de seguimientos con fecha (crear / marcar hecho / WhatsApp) */}
      <AgendaCrm onAbrirCliente={setSeleccionadoId} onAgendar={() => abrirAgenda()} />

      {/* Inteligencia del negocio (arranca colapsada) */}
      <InteligenciaPanel onAbrirCliente={setSeleccionadoId} />

      {/* Todos los clientes, con filtros rápidos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Clientes</CardTitle>
          <CardDescription className="text-xs">
            Tocá una tarjeta para filtrar. Las compras incluyen ventas a crédito, ventas rápidas,
            boletas con el cliente (o su CUIT, teléfono o nombre) y pedidos de la tienda online
            aprobados. Los clientes de la tienda se crean solos, con la etiqueta "web".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tarjetas.map((t) => (
              <button
                key={t.filtro}
                type="button"
                onClick={() => setFiltro(filtro === t.filtro ? "todos" : t.filtro)}
                className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                  filtro === t.filtro ? "ring-2 ring-primary" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className={`text-2xl font-semibold ${t.clase}`}>{conteo[t.filtro] ?? 0}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por nombre, teléfono o CUIT"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
              <SelectTrigger aria-label="Segmento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos ({clientes.length})</SelectItem>
                {(Object.keys(SEGMENTOS) as Segmento[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEGMENTOS[s].label} ({conteo[s] ?? 0})
                  </SelectItem>
                ))}
                <SelectItem value="con_deuda">Con deuda ({conteo.con_deuda ?? 0})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={etiqueta} onValueChange={setEtiqueta} disabled={etiquetas.length === 0}>
              <SelectTrigger aria-label="Etiqueta">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las etiquetas</SelectItem>
                {etiquetas.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
              <SelectTrigger aria-label="Ordenar por">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ORDENES) as Orden[]).map((o) => (
                  <SelectItem key={o} value={o}>
                    {ORDENES[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ordenados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay clientes con ese filtro.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {ordenados.map((c) => {
                const segmento = SEGMENTOS[c.segmento];
                const wa = linkWhatsApp(c.telefono);
                return (
                  <li key={c.id} className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => setSeleccionadoId(c.id)}
                      className="grid min-w-0 flex-1 grid-cols-1 gap-2 p-3 text-left transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm truncate">{c.nombre}</span>
                          <Badge className={`${segmento.clase} border-0 text-[11px]`}>{segmento.label}</Badge>
                          {c.etiquetas.map((e) => (
                            <Badge key={e} variant="outline" className="text-[11px]">{e}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.telefono || "Sin teléfono"}
                          {c.ultima_compra
                            ? ` · última compra hace ${c.dias_sin_comprar} día${c.dias_sin_comprar !== 1 ? "s" : ""}`
                            : ""}
                          {c.proximo_seguimiento &&
                            ` · seguimiento ${formatFechaLocal(c.proximo_seguimiento, { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <div className="flex sm:flex-col sm:items-end gap-x-3 text-xs">
                        <span className="font-semibold text-sm">{formatPesos(c.total_comprado)}</span>
                        <span className="text-muted-foreground">
                          {c.compras} compra{c.compras !== 1 ? "s" : ""}
                        </span>
                        {c.saldo_pendiente > 0 && (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            Debe {formatPesos(c.saldo_pendiente)}
                          </span>
                        )}
                      </div>
                    </button>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Escribir por WhatsApp"
                        className="flex shrink-0 items-center border-l px-3 text-green-600 transition-colors hover:bg-muted/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ClienteFicha cliente={seleccionado} onClose={() => setSeleccionadoId(null)} />
      <NuevaTareaDialog
        clientes={clientes}
        state={agendar}
        onOpenChange={(open) => setAgendar((s) => ({ ...s, open }))}
      />
    </div>
  );
}
