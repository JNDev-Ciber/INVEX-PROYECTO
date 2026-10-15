import { useMemo, useState } from "react";
import {
  ArrowRight,
  Ban,
  Eye,
  Loader2,
  PackageCheck,
  Plus,
  Search,
  Send,
  Trash2,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/app/stores";
import { esAdmin } from "@/shared/lib/roles";
import { useSucursalActiva, useSucursales } from "@/features/sucursales/hooks/use-sucursales";
import type { EstadoRemito, Remito, RemitoItem } from "@/mocks/remitos";
import {
  useAnularRemito,
  useBuscarStockParaRemito,
  useCrearRemito,
  useEnviarRemito,
  useRecibirRemito,
  useRemitoItems,
  useRemitos,
} from "@/features/remitos/hooks/use-remitos";

const ESTADOS: Record<EstadoRemito, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  enviado: { label: "En camino", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  recibido: { label: "Recibido", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  recibido_con_diferencias: {
    label: "Recibido con faltantes",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  anulado: { label: "Anulado", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

function fecha(valor: string | null) {
  return valor
    ? new Date(valor).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
    : "";
}

function mensaje(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function RemitosView() {
  const rol = useAuthStore((s) => s.user?.rol);
  // Crean, envían y anulan remitos: el encargado de logística y caja.
  const gestiona = rol === "encargado" || rol === "caja";
  const veTodos = gestiona || esAdmin(rol);
  const { sucursalId } = useSucursalActiva();
  const { data: remitos = [], isLoading } = useRemitos();
  const [detalle, setDetalle] = useState<Remito | null>(null);
  const [recibiendo, setRecibiendo] = useState<Remito | null>(null);

  // Encargado y caja: todos los que están en camino. Resto: los que llegan a su sucursal.
  const porRecibir = remitos.filter(
    (r) => r.estado === "enviado" && (gestiona || r.destino_id === sucursalId)
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-base font-semibold">Remitos internos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {gestiona
            ? "Mové mercadería entre sucursales. El stock sale del origen al enviar y entra al destino cuando lo reciben."
            : veTodos
            ? "Transferencias entre sucursales. Las crean y envían el encargado de logística o caja."
            : "Mercadería que llega a tu sucursal desde otras sucursales."}
        </p>
      </div>

      {gestiona && <NuevoRemitoCard />}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            {gestiona ? "En camino" : "Por recibir en tu sucursal"}
          </CardTitle>
          <CardDescription className="text-xs">
            Cuando llegue la mercadería, confirmá lo que se recibió. Si falta algo, cargá la cantidad real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Cargando />
          ) : porRecibir.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No hay remitos en camino.</p>
          ) : (
            <div className="space-y-2">
              {porRecibir.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <ResumenRemito remito={r} />
                  <Button size="sm" onClick={() => setRecibiendo(r)} className="shrink-0">
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Mercadería recibida
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Cargando />
          ) : remitos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Todavía no hay remitos.</p>
          ) : (
            <div className="space-y-2">
              {remitos.map((r) => (
                <FilaRemito
                  key={r.id}
                  remito={r}
                  gestiona={gestiona}
                  onVer={() => setDetalle(r)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {detalle && <DetalleDialog remito={detalle} onClose={() => setDetalle(null)} />}
      {recibiendo && <RecibirDialog remito={recibiendo} onClose={() => setRecibiendo(null)} />}
    </div>
  );
}

function Cargando() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoRemito }) {
  const e = ESTADOS[estado];
  return <Badge variant="outline" className={`text-[10px] h-5 border-0 ${e.className}`}>{e.label}</Badge>;
}

function ResumenRemito({ remito: r }: { remito: Remito }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-semibold">Remito #{r.numero}</p>
        <EstadoBadge estado={r.estado} />
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
        <span>{r.origen_nombre}</span>
        <ArrowRight className="h-3 w-3" />
        <span>{r.destino_nombre}</span>
        <span>·</span>
        <span>
          {r.unidades_enviadas} {r.unidades_enviadas === 1 ? "unidad" : "unidades"} en {r.renglones}{" "}
          {r.renglones === 1 ? "producto" : "productos"}
        </span>
        {r.enviado_en && <span>· enviado {fecha(r.enviado_en)}</span>}
      </p>
    </div>
  );
}

function FilaRemito({
  remito: r,
  gestiona,
  onVer,
}: {
  remito: Remito;
  gestiona: boolean;
  onVer: () => void;
}) {
  const { toast } = useToast();
  const enviar = useEnviarRemito();
  const anular = useAnularRemito();
  const [confirmarAnular, setConfirmarAnular] = useState(false);

  const onEnviar = async () => {
    try {
      await enviar.mutateAsync(r.id);
      toast({ title: `Remito #${r.numero} enviado` });
    } catch (err) {
      toast({ title: mensaje(err, "No se pudo enviar el remito"), variant: "destructive" });
    }
  };

  const onAnular = async () => {
    try {
      await anular.mutateAsync({ id: r.id });
      toast({
        title: `Remito #${r.numero} anulado`,
        description: r.estado === "enviado" ? "La mercadería volvió al origen." : undefined,
      });
      setConfirmarAnular(false);
    } catch (err) {
      toast({ title: mensaje(err, "No se pudo anular el remito"), variant: "destructive" });
    }
  };

  const puedeOperar = gestiona && (r.estado === "borrador" || r.estado === "enviado");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <ResumenRemito remito={r} />
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onVer} aria-label={`Ver remito ${r.numero}`}>
          <Eye className="h-4 w-4" />
        </Button>
        {puedeOperar && r.estado === "borrador" && (
          <Button size="sm" onClick={onEnviar} disabled={enviar.isPending}>
            {enviar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar
          </Button>
        )}
        {puedeOperar && (
          <Button variant="outline" size="sm" onClick={() => setConfirmarAnular(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Anular
          </Button>
        )}
      </div>

      {confirmarAnular && (
        <Dialog open onOpenChange={(open) => !open && setConfirmarAnular(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>¿Anular el remito #{r.numero}?</DialogTitle>
              <DialogDescription>
                {r.estado === "enviado"
                  ? `La mercadería vuelve al stock de ${r.origen_nombre}.`
                  : "El remito todavía no movió stock."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmarAnular(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={onAnular} disabled={anular.isPending}>
                {anular.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Anular remito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NuevoRemitoCard() {
  const { toast } = useToast();
  const { data: sucursales = [] } = useSucursales();
  const activas = sucursales.filter((s) => s.activa);
  const crear = useCrearRemito();

  const [origenId, setOrigenId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState<
    Array<{ producto_id: string; nombre: string; codigo: string; stock: number; cantidad: number }>
  >([]);

  const { data: resultados = [], isFetching } = useBuscarStockParaRemito(origenId || null, busqueda.trim());
  const disponibles = useMemo(
    () => resultados.filter((p) => !items.some((i) => i.producto_id === p.producto_id)),
    [resultados, items]
  );

  const cambiarOrigen = (id: string) => {
    setOrigenId(id);
    setItems([]); // el stock disponible depende del origen
    if (id === destinoId) setDestinoId("");
  };

  const excedidos = items.filter((i) => i.cantidad > i.stock);
  const valido =
    origenId && destinoId && origenId !== destinoId && items.length > 0 &&
    items.every((i) => i.cantidad > 0) && excedidos.length === 0;

  const guardar = async (enviar: boolean) => {
    if (!valido) return;
    try {
      await crear.mutateAsync({
        origenId,
        destinoId,
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        observaciones,
        enviar,
      });
      toast({ title: enviar ? "Remito creado y enviado" : "Remito guardado como borrador" });
      setItems([]);
      setObservaciones("");
      setBusqueda("");
    } catch (err) {
      toast({ title: mensaje(err, "No se pudo crear el remito"), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo remito
        </CardTitle>
        <CardDescription className="text-xs">
          Elegí de dónde sale y a dónde va la mercadería, y agregá los productos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Sale de</Label>
            <Select value={origenId} onValueChange={cambiarOrigen}>
              <SelectTrigger aria-label="Sucursal de origen"><SelectValue placeholder="Sucursal de origen" /></SelectTrigger>
              <SelectContent>
                {activas.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Va a</Label>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger aria-label="Sucursal de destino"><SelectValue placeholder="Sucursal de destino" /></SelectTrigger>
              <SelectContent>
                {activas.filter((s) => s.id !== origenId).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {origenId && (
          <div className="space-y-2">
            <Label htmlFor="remito-buscar" className="text-xs font-medium">Agregar productos</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="remito-buscar"
                className="pl-9"
                placeholder="Buscar por nombre, código o código de barras"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
              {isFetching && disponibles.length === 0 ? (
                <Cargando />
              ) : disponibles.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-3">Sin productos con stock en el origen.</p>
              ) : (
                disponibles.map((p) => (
                  <button
                    key={p.producto_id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() =>
                      setItems((prev) => [
                        ...prev,
                        { producto_id: p.producto_id, nombre: p.nombre, codigo: p.codigo, stock: p.stock, cantidad: 1 },
                      ])
                    }
                  >
                    <span className="min-w-0 truncate">{p.nombre} <span className="text-xs text-muted-foreground">{p.codigo}</span></span>
                    <span className="text-xs text-muted-foreground shrink-0">Stock: {p.stock}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.producto_id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{i.nombre}</p>
                  <p className={`text-xs ${i.cantidad > i.stock ? "text-destructive" : "text-muted-foreground"}`}>
                    Disponible en origen: {i.stock}
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={i.stock}
                  className="w-24"
                  aria-label={`Cantidad de ${i.nombre}`}
                  value={i.cantidad}
                  onChange={(e) => {
                    const cantidad = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setItems((prev) => prev.map((x) => (x.producto_id === i.producto_id ? { ...x, cantidad } : x)));
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label={`Quitar ${i.nombre}`}
                  onClick={() => setItems((prev) => prev.filter((x) => x.producto_id !== i.producto_id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="remito-obs" className="text-xs font-medium">Observaciones</Label>
          <Textarea
            id="remito-obs"
            placeholder="Opcional: transporte, chofer, horario..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => guardar(true)} disabled={!valido || crear.isPending}>
            {crear.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Crear y enviar
          </Button>
          <Button variant="outline" onClick={() => guardar(false)} disabled={!valido || crear.isPending}>
            Guardar borrador
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DetalleDialog({ remito: r, onClose }: { remito: Remito; onClose: () => void }) {
  const { data: items = [], isLoading } = useRemitoItems(r.id);
  const recibido = r.estado === "recibido" || r.estado === "recibido_con_diferencias";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Remito #{r.numero} <EstadoBadge estado={r.estado} />
          </DialogTitle>
          <DialogDescription>
            {r.origen_nombre} → {r.destino_nombre}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Creado: {r.creado_por} {fecha(r.creado_en)}</span>
            {r.enviado_en && <span>Enviado: {r.enviado_por} {fecha(r.enviado_en)}</span>}
            {r.recibido_en && <span>Recibido: {r.recibido_por} {fecha(r.recibido_en)}</span>}
            {r.anulado_en && <span>Anulado: {r.anulado_por} {fecha(r.anulado_en)}</span>}
          </div>
          {r.observaciones && <p className="text-xs rounded-md bg-muted px-3 py-2">{r.observaciones}</p>}
          {isLoading ? (
            <Cargando />
          ) : (
            <div className="rounded-lg border divide-y">
              {items.map((i) => {
                const faltan = recibido && i.cantidad_recibida != null ? i.cantidad_enviada - i.cantidad_recibida : 0;
                return (
                  <div key={i.producto_id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate">{i.nombre}</span>
                    <span className="text-xs shrink-0 text-right">
                      Enviado: {i.cantidad_enviada}
                      {recibido && <> · Recibido: {i.cantidad_recibida}</>}
                      {faltan > 0 && <span className="text-destructive"> · Faltan {faltan}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecibirDialog({ remito: r, onClose }: { remito: Remito; onClose: () => void }) {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useRemitoItems(r.id);
  const recibir = useRecibirRemito();
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  const cantidad = (productoId: string, enviada: number) => cantidades[productoId] ?? enviada;
  const faltantes = items.filter((i) => cantidad(i.producto_id, i.cantidad_enviada) < i.cantidad_enviada);

  const confirmar = async () => {
    try {
      const estado = await recibir.mutateAsync({
        id: r.id,
        items: items.map((i) => ({
          producto_id: i.producto_id,
          cantidad_recibida: cantidad(i.producto_id, i.cantidad_enviada),
        })),
      });
      toast({
        title: `Mercadería del remito #${r.numero} recibida`,
        description: estado === "recibido_con_diferencias" ? "Quedó registrado el faltante." : undefined,
      });
      onClose();
    } catch (err) {
      toast({ title: mensaje(err, "No se pudo confirmar la recepción"), variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mercadería recibida del remito #{r.numero}</DialogTitle>
          <DialogDescription>
            Desde {r.origen_nombre}. Revisá lo que llegó; si falta algo, corregí la cantidad.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Cargando />
        ) : (
          <div className="rounded-lg border divide-y">
            {items.map((i) => (
              <div key={i.producto_id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{i.nombre}</p>
                  <p className="text-xs text-muted-foreground">Enviado: {i.cantidad_enviada}</p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={i.cantidad_enviada}
                  className="w-24"
                  aria-label={`Recibido de ${i.nombre}`}
                  value={cantidad(i.producto_id, i.cantidad_enviada)}
                  onChange={(e) => {
                    const v = Math.min(i.cantidad_enviada, Math.max(0, Math.floor(Number(e.target.value) || 0)));
                    setCantidades((prev) => ({ ...prev, [i.producto_id]: v }));
                  }}
                />
              </div>
            ))}
          </div>
        )}
        {faltantes.length > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Faltan unidades en {faltantes.length} {faltantes.length === 1 ? "producto" : "productos"}: el remito queda
            como recibido con faltantes.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={isLoading || recibir.isPending}>
            {recibir.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackageCheck className="h-4 w-4 mr-2" />}
            Confirmar recepción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
