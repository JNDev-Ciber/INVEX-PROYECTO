import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader2,
  MessageCircle,
  Save,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatFechaLocal } from "@/shared/lib/date";
import type { ClienteCrm, TipoSeguimiento } from "@/mocks/crm";
import {
  useActualizarCliente,
  useAgregarSeguimiento,
  useClienteDetalle,
  useCompletarSeguimiento,
  useEliminarSeguimiento,
} from "../hooks/use-crm";
import { SEGMENTOS, TIPOS_SEGUIMIENTO, formatPesos, hoyISO, linkWhatsApp } from "../lib/crm-format";

const ORIGENES = { fiado: "Crédito", caja: "Caja", rapida: "Venta rápida", web: "Tienda online" } as const;

/** Mensaje de la base sin el "(code=P0001)" que agrega normalizeRpcError. */
function mensajeError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : "";
  return msg.replace(/\s*\(code=.*\)$/, "") || fallback;
}

export function ClienteFicha({
  cliente,
  onClose,
}: {
  cliente: ClienteCrm | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!cliente} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {cliente && <FichaContenido key={cliente.id} cliente={cliente} />}
      </SheetContent>
    </Sheet>
  );
}

function FichaContenido({ cliente }: { cliente: ClienteCrm }) {
  const segmento = SEGMENTOS[cliente.segmento];
  const wa = linkWhatsApp(cliente.telefono);

  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2">
          {cliente.nombre}
          <Badge className={`${segmento.clase} border-0`} title={segmento.descripcion}>
            {segmento.label}
          </Badge>
        </SheetTitle>
        <SheetDescription>
          {cliente.compras > 0
            ? `${cliente.compras} compra${cliente.compras !== 1 ? "s" : ""} por ${formatPesos(cliente.total_comprado)} · ticket promedio ${formatPesos(cliente.ticket_promedio)}`
            : "Sin compras registradas"}
        </SheetDescription>
      </SheetHeader>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Dato titulo="Última compra" valor={
          cliente.ultima_compra
            ? `hace ${cliente.dias_sin_comprar} día${cliente.dias_sin_comprar !== 1 ? "s" : ""}`
            : "—"
        } />
        <Dato titulo="Compras 90 días" valor={String(cliente.compras_90_dias)} />
        <Dato
          titulo="Debe"
          valor={formatPesos(cliente.saldo_pendiente)}
          destacado={cliente.saldo_pendiente > 0}
        />
      </div>

      {wa && (
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            Escribir por WhatsApp
          </a>
        </Button>
      )}

      <Tabs defaultValue="seguimientos">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="seguimientos">Seguimiento</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="datos">Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="seguimientos" className="pt-3">
          <Seguimientos clienteId={cliente.id} />
        </TabsContent>
        <TabsContent value="compras" className="pt-3">
          <Compras clienteId={cliente.id} />
        </TabsContent>
        <TabsContent value="productos" className="pt-3">
          <Productos clienteId={cliente.id} />
        </TabsContent>
        <TabsContent value="datos" className="pt-3">
          <DatosForm cliente={cliente} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Dato({ titulo, valor, destacado }: { titulo: string; valor: string; destacado?: boolean }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-[11px] text-muted-foreground">{titulo}</p>
      <p className={`text-sm font-semibold ${destacado ? "text-red-600 dark:text-red-400" : ""}`}>
        {valor}
      </p>
    </div>
  );
}

function Cargando() {
  return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Seguimientos({ clienteId }: { clienteId: number }) {
  const { toast } = useToast();
  const { data, isLoading } = useClienteDetalle(clienteId);
  const agregar = useAgregarSeguimiento();
  const completar = useCompletarSeguimiento();
  const eliminar = useEliminarSeguimiento();

  const [tipo, setTipo] = useState<TipoSeguimiento>("nota");
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState("");

  const guardar = async () => {
    if (!texto.trim()) return;
    try {
      await agregar.mutateAsync({
        clienteId,
        tipo,
        texto,
        fechaProgramada: fecha || null,
      });
      setTexto("");
      setFecha("");
      setTipo("nota");
    } catch (err) {
      toast({ title: mensajeError(err, "No se pudo guardar"), variant: "destructive" });
    }
  };

  const accion = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (err) {
      toast({ title: mensajeError(err, "No se pudo actualizar"), variant: "destructive" });
    }
  };

  const hoy = hoyISO();

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-md border p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoSeguimiento)}>
            <SelectTrigger aria-label="Tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIPOS_SEGUIMIENTO).map(([valor, label]) => (
                <SelectItem key={valor} value={valor}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            aria-label="Para cuándo"
            value={fecha}
            min={hoy}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <Textarea
          placeholder={tipo === "tarea" ? "Qué hay que hacer (ej: avisarle cuando llegue la heladera)" : "Qué pasó o qué habló el cliente"}
          value={texto}
          maxLength={1000}
          rows={2}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Con fecha, queda pendiente en la agenda.{tipo === "tarea" && " La tarea necesita fecha."}
          </p>
          <Button
            size="sm"
            onClick={guardar}
            disabled={agregar.isPending || !texto.trim() || (tipo === "tarea" && !fecha)}
          >
            {agregar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Agregar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Cargando />
      ) : !data?.seguimientos.length ? (
        <p className="text-sm text-muted-foreground text-center py-4">Todavía no hay seguimientos.</p>
      ) : (
        <ul className="space-y-2">
          {data.seguimientos.map((s) => {
            const pendiente = !s.hecho && !!s.fecha_programada;
            const vencido = pendiente && s.fecha_programada! < hoy;
            return (
              <li key={s.id} className="flex gap-3 rounded-md border p-3">
                {s.fecha_programada ? (
                  <button
                    type="button"
                    className="mt-0.5 shrink-0"
                    title={s.hecho ? "Marcar como pendiente" : "Marcar como hecho"}
                    onClick={() => accion(() => completar.mutateAsync({ id: s.id, hecho: !s.hecho }))}
                  >
                    {s.hecho ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ) : (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{TIPOS_SEGUIMIENTO[s.tipo]}</Badge>
                    {s.fecha_programada && (
                      <span className={`flex items-center gap-1 ${vencido ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                        <CalendarClock className="h-3 w-3" />
                        {vencido ? "Vencido · " : ""}
                        {formatFechaLocal(s.fecha_programada)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 whitespace-pre-wrap break-words ${s.hecho ? "line-through text-muted-foreground" : ""}`}>
                    {s.texto}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(s.creado_en).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                    {s.creado_por && ` · ${s.creado_por}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title="Borrar"
                  onClick={() => {
                    if (window.confirm("¿Borrar este seguimiento?")) {
                      accion(() => eliminar.mutateAsync(s.id));
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Compras({ clienteId }: { clienteId: number }) {
  const { data, isLoading } = useClienteDetalle(clienteId);
  if (isLoading) return <Cargando />;

  return (
    <div className="space-y-4">
      {!data?.compras.length ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay compras registradas. Se cuentan las ventas a crédito, las ventas
          rápidas y boletas en las que se eligió el cliente, los pedidos de la
          tienda online aprobados y las boletas con su CUIT, teléfono o nombre.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {data.compras.map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{c.referencia}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFechaLocal(c.fecha)} · {ORIGENES[c.origen]}
                  {c.sucursal && ` · ${c.sucursal}`}
                </p>
              </div>
              <span className="font-semibold shrink-0">{formatPesos(c.total)}</span>
            </li>
          ))}
        </ul>
      )}

      {!!data?.pagos.length && (
        <div>
          <p className="text-xs font-medium mb-2">Pagos de deuda</p>
          <ul className="divide-y rounded-md border">
            {data.pagos.map((p, i) => (
              <li key={i} className="flex justify-between p-2.5 text-sm">
                <span className="text-muted-foreground">{formatFechaLocal(p.fecha)}</span>
                <span className="font-medium text-green-700 dark:text-green-400">{formatPesos(p.monto)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Productos({ clienteId }: { clienteId: number }) {
  const { data, isLoading } = useClienteDetalle(clienteId);
  if (isLoading) return <Cargando />;
  if (!data?.productos.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">Sin productos registrados.</p>;
  }
  return (
    <ul className="divide-y rounded-md border">
      {data.productos.map((p) => (
        <li key={p.nombre} className="flex items-center justify-between gap-3 p-3 text-sm">
          <span className="truncate">{p.nombre}</span>
          <span className="text-muted-foreground shrink-0">
            {p.cantidad} u. · {formatPesos(p.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DatosForm({ cliente }: { cliente: ClienteCrm }) {
  const { toast } = useToast();
  const actualizar = useActualizarCliente();
  const [form, setForm] = useState({
    nombre: cliente.nombre,
    telefono: cliente.telefono ?? "",
    cuit: cliente.cuit ?? "",
    email: cliente.email ?? "",
    direccion: cliente.direccion ?? "",
    notas: cliente.notas,
    etiquetas: cliente.etiquetas.join(", "),
  });

  // Al guardar, la base normaliza las etiquetas (minúscula, sin repetir).
  const etiquetasGuardadas = cliente.etiquetas.join(", ");
  useEffect(() => {
    setForm((f) => ({ ...f, etiquetas: etiquetasGuardadas }));
  }, [etiquetasGuardadas]);

  const set = (campo: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async () => {
    try {
      await actualizar.mutateAsync({
        clienteId: cliente.id,
        datos: {
          ...form,
          etiquetas: form.etiquetas.split(",").map((e) => e.trim()).filter(Boolean),
        },
      });
      toast({ title: "Cliente actualizado" });
    } catch (err) {
      toast({ title: mensajeError(err, "No se pudo guardar"), variant: "destructive" });
    }
  };

  const campos: Array<[keyof typeof form, string, string]> = [
    ["nombre", "Nombre", ""],
    ["telefono", "Teléfono", "351 555-1234"],
    ["cuit", "CUIT", "Opcional"],
    ["email", "Email", "Opcional"],
    ["direccion", "Dirección", "Opcional"],
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campos.map(([campo, label, placeholder]) => (
          <div key={campo} className="space-y-1.5">
            <Label htmlFor={`crm-${campo}`} className="text-xs">{label}</Label>
            <Input id={`crm-${campo}`} placeholder={placeholder} value={form[campo]} onChange={set(campo)} />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="crm-etiquetas" className="text-xs">Etiquetas</Label>
          <Input
            id="crm-etiquetas"
            placeholder="mayorista, vip"
            value={form.etiquetas}
            onChange={set("etiquetas")}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="crm-notas" className="text-xs">Notas</Label>
        <Textarea
          id="crm-notas"
          placeholder="Preferencias, horarios, cómo le gusta que lo contacten..."
          rows={4}
          maxLength={4000}
          value={form.notas}
          onChange={set("notas")}
        />
      </div>
      <Button onClick={guardar} disabled={actualizar.isPending || !form.nombre.trim()}>
        {actualizar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Guardar
      </Button>
    </div>
  );
}
