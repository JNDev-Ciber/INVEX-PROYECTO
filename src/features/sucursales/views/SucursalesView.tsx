import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, MapPin, Package, Pencil, Phone, Plus, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/app/stores";
import { esAdmin } from "@/shared/lib/roles";
import type { Sucursal } from "@/mocks/sucursales";
import {
  useCrearSucursal,
  useEditarSucursal,
  useSucursales,
} from "@/features/sucursales/hooks/use-sucursales";

/** Mensaje de la base sin el "(code=P0001)" que agrega normalizeRpcError. */
function mensajeError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : "";
  return msg.replace(/\s*\(code=.*\)$/, "") || fallback;
}

export default function SucursalesView() {
  const rol = useAuthStore((s) => s.user?.rol);
  const { toast } = useToast();
  const { data: sucursales = [], isLoading } = useSucursales();
  const crearMutation = useCrearSucursal();

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [editando, setEditando] = useState<Sucursal | null>(null);
  const [verNueva, setVerNueva] = useState(false);

  if (!esAdmin(rol)) {
    return (
      <p className="text-sm text-muted-foreground">
        Solo el administrador puede gestionar sucursales.
      </p>
    );
  }

  const crear = async () => {
    if (!nombre.trim()) return;
    try {
      await crearMutation.mutateAsync({ nombre, direccion, telefono });
      toast({ title: "Sucursal creada" });
      setNombre("");
      setDireccion("");
      setTelefono("");
    } catch (err) {
      toast({
        title: mensajeError(err, "Error al crear la sucursal"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Store className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-semibold">Sucursales</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Cada sucursal tiene su propio stock. Los usuarios se asignan desde Usuarios.
        </p>
      </div>

      <Card>
        <button
          type="button"
          onClick={() => setVerNueva((v) => !v)}
          className="w-full text-left"
          aria-expanded={verNueva}
        >
          <CardHeader className="pb-6 flex-row items-start justify-between gap-2 space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nueva sucursal
              </CardTitle>
              <CardDescription className="text-xs">
                Arranca sin stock: la mercadería llega con compras o, más adelante, con remitos.
              </CardDescription>
            </div>
            {verNueva ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </CardHeader>
        </button>
        {verNueva && (
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="suc-nombre" className="text-xs font-medium">Nombre</Label>
              <Input
                id="suc-nombre"
                placeholder="Sucursal Centro"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crear()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suc-direccion" className="text-xs font-medium">Dirección</Label>
              <Input
                id="suc-direccion"
                placeholder="Opcional"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suc-telefono" className="text-xs font-medium">Teléfono</Label>
              <Input
                id="suc-telefono"
                placeholder="Opcional"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={crear}
            disabled={crearMutation.isPending || !nombre.trim()}
            className="w-full sm:w-auto"
          >
            {crearMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Crear sucursal
          </Button>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Store className="h-4 w-4" />
              Sucursales
            </CardTitle>
            {!isLoading && (
              <Badge variant="secondary" className="text-xs">{sucursales.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {sucursales.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-4 transition-colors hover:bg-accent/40 ${s.activa ? "" : "opacity-60"}`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{s.nombre}</p>
                      {s.es_principal && (
                        <Badge variant="outline" className="text-[10px] h-5">Principal</Badge>
                      )}
                      {!s.activa && (
                        <Badge variant="secondary" className="text-[10px] h-5">Inactiva</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-muted-foreground">
                      {s.direccion && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.direccion}</span>
                      )}
                      {s.telefono && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.telefono}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {s.usuarios} {s.usuarios === 1 ? "usuario" : "usuarios"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {s.unidades_stock.toLocaleString("es-AR")} unidades
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    aria-label={`Editar ${s.nombre}`}
                    onClick={() => setEditando(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editando && (
        <EditarSucursalDialog sucursal={editando} onClose={() => setEditando(null)} />
      )}
    </div>
  );
}

function EditarSucursalDialog({
  sucursal,
  onClose,
}: {
  sucursal: Sucursal;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const editarMutation = useEditarSucursal();
  const [nombre, setNombre] = useState(sucursal.nombre);
  const [direccion, setDireccion] = useState(sucursal.direccion ?? "");
  const [telefono, setTelefono] = useState(sucursal.telefono ?? "");
  const [activa, setActiva] = useState(sucursal.activa);

  const guardar = async () => {
    try {
      await editarMutation.mutateAsync({
        id: sucursal.id,
        nombre,
        direccion: direccion || null,
        telefono: telefono || null,
        activa,
      });
      toast({ title: "Sucursal actualizada" });
      onClose();
    } catch (err) {
      toast({
        title: mensajeError(err, "Error al guardar la sucursal"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar sucursal</DialogTitle>
          <DialogDescription>
            Para desactivarla no puede tener stock ni usuarios asignados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nombre" className="text-xs font-medium">Nombre</Label>
            <Input id="edit-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-direccion" className="text-xs font-medium">Dirección</Label>
            <Input id="edit-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-telefono" className="text-xs font-medium">Teléfono</Label>
            <Input id="edit-telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <Label htmlFor="edit-activa" className="text-sm">Activa</Label>
            <Switch
              id="edit-activa"
              checked={activa}
              onCheckedChange={setActiva}
              disabled={sucursal.es_principal}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={editarMutation.isPending || !nombre.trim()}>
            {editarMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
