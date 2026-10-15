import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useUsuarios,
  useCreateUsuario,
  useDeleteUsuario,
  useUpdateUsuarioRol,
} from "@/features/usuarios/hooks/useUsuarios";
import {
  useAsignarSucursalUsuario,
  useSucursales,
} from "@/features/sucursales/hooks/use-sucursales";

/** Mensaje de la base sin el "(code=...)" que agrega normalizeRpcError. */
function mensajeError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : "";
  return msg.replace(/\s*\(code=.*\)$/, "") || fallback;
}

const ROL_LABELS: Record<string, string> = {
  vendedor: "Vendedor",
  caja: "Caja",
  encargado: "Encargado",
  admin: "Admin",
};

const ROL_COLORS: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  caja: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  encargado: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  vendedor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
};

export default function UsuariosView() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"vendedor" | "caja" | "encargado">("vendedor");
  const [sucursalId, setSucursalId] = useState<string>("");

  const { data: usuarios = [], isLoading: fetchLoading } = useUsuarios();
  const { data: sucursales = [] } = useSucursales();
  const sucursalesActivas = sucursales.filter((s) => s.activa);
  // Con una sola sucursal no se muestra el selector: el alta usa la principal.
  const mostrarSucursal = sucursalesActivas.length > 1;
  const sucursalNueva =
    sucursalId || sucursalesActivas.find((s) => s.es_principal)?.id || "";
  const createMutation = useCreateUsuario();
  const deleteMutation = useDeleteUsuario();
  const updateRolMutation = useUpdateUsuarioRol();
  const asignarSucursalMutation = useAsignarSucursalUsuario();

  const crearUsuario = async () => {
    if (!username.trim() || !password.trim()) {
      toast({ title: "Completá usuario y contraseña", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        username: username.trim(),
        password,
        rol,
        sucursalId: sucursalNueva || null,
      });
      toast({ title: "Usuario creado correctamente" });
      setUsername("");
      setPassword("");
      setRol("vendedor");
    } catch (err) {
      toast({ title: mensajeError(err, "Error al crear el usuario"), variant: "destructive" });
    }
  };

  const eliminarUsuario = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Usuario eliminado" });
    } catch (err) {
      toast({ title: mensajeError(err, "Error al eliminar usuario"), variant: "destructive" });
    }
  };

  const cambiarRol = async (id: string, newRol: string) => {
    try {
      await updateRolMutation.mutateAsync({ id, rol: newRol });
    } catch (err) {
      toast({ title: mensajeError(err, "Error al actualizar rol"), variant: "destructive" });
    }
  };

  const cambiarSucursal = async (userId: string, nuevaSucursalId: string) => {
    try {
      await asignarSucursalMutation.mutateAsync({ userId, sucursalId: nuevaSucursalId });
      toast({ title: "Sucursal asignada" });
    } catch (err) {
      toast({ title: mensajeError(err, "Error al asignar sucursal"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-semibold">Usuarios</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestioná los usuarios y sus roles de acceso
        </p>
      </div>

      {/* Crear usuario */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </CardTitle>
          <CardDescription className="text-xs">
            Completá los datos para crear un nuevo acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium">
                Usuario
              </Label>
              <Input
                id="username"
                placeholder="nombre_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crearUsuario()}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crearUsuario()}
              />
            </div>
          </div>

          <div className={mostrarSucursal ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rol</Label>
              <Select value={rol} onValueChange={(v) => setRol(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="caja">Caja</SelectItem>
                  <SelectItem value="encargado">Encargado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mostrarSucursal && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sucursal</Label>
                <Select value={sucursalNueva} onValueChange={setSucursalId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elegí una sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursalesActivas.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button
            onClick={crearUsuario}
            disabled={createMutation.isPending || !username.trim() || !password.trim()}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Crear usuario
          </Button>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios activos
            </CardTitle>
            {!fetchLoading && (
              <Badge variant="secondary" className="text-xs">
                {usuarios.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {fetchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin usuarios registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuarios.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-4 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold">
                        {u.username[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.username}</p>
                      <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border mt-0.5 ${ROL_COLORS[u.rol] ?? ROL_COLORS.vendedor}`}>
                        {ROL_LABELS[u.rol] ?? u.rol}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {mostrarSucursal && (
                      <Select
                        value={u.sucursal_id ?? ""}
                        onValueChange={(v) => cambiarSucursal(u.id, v)}
                      >
                        <SelectTrigger className="h-8 w-36 text-xs" aria-label="Sucursal">
                          <SelectValue placeholder="Sin sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                          {sucursalesActivas.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select
                      value={u.rol}
                      onValueChange={(v) => cambiarRol(u.id, v)}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="caja">Caja</SelectItem>
                  <SelectItem value="encargado">Encargado</SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente a{" "}
                            <span className="font-semibold">{u.username}</span>. No se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => eliminarUsuario(u.id)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
