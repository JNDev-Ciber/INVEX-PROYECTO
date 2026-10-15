
import { useMemo, useState } from "react";
import { Award, Download, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVentasPorEmpleado } from "@/features/ventas-empleados/hooks/use-ventas-empleados";
import { useEmpleados } from "@/features/empleados/hooks/use-empleados";
import { useUsuarios } from "@/features/usuarios/hooks/useUsuarios";
import { exportVentasPorEmpleadoToExcel } from "@/shared/lib/excel-export";
import { METODO_PAGO_LABELS, type VentaPorEmpleado } from "@/shared/types/inventory";
import { useToast } from "@/hooks/use-toast";

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

function metodoPagoLabel(key: string): string {
  return (METODO_PAGO_LABELS as Record<string, string>)[key] ?? key;
}

export default function VentasEmpleadosView() {
  const { toast } = useToast();
  const now = useMemo(() => new Date(), []);
  const [fechaInicio, setFechaInicio] = useState(toDateInputValue(startOfMonth(now)));
  const [fechaFin, setFechaFin] = useState(toDateInputValue(startOfNextMonth(now)));
  const [detalleEmpleado, setDetalleEmpleado] = useState<VentaPorEmpleado | null>(null);

  const { ventas, isLoading } = useVentasPorEmpleado(
    new Date(fechaInicio).toISOString(),
    new Date(fechaFin).toISOString()
  );
  const { empleados, vincularUsuario } = useEmpleados();
  const { data: usuarios } = useUsuarios();

  const totalGeneral = useMemo(
    () => ventas.reduce((sum, v) => sum + v.totalVendido, 0),
    [ventas]
  );
  const topVendedor = ventas[0] ?? null;

  const chartData = useMemo(
    () =>
      ventas.map((v) => ({
        nombre: v.nombreMostrado.length > 14 ? `${v.nombreMostrado.slice(0, 14)}…` : v.nombreMostrado,
        total: v.totalVendido,
      })),
    [ventas]
  );

  const empleadosDisponibles = useMemo(
    () => empleados.filter((e) => !e.usuario_id),
    [empleados]
  );

  const setPreset = (preset: "este-mes" | "mes-anterior") => {
    const base = new Date();
    if (preset === "este-mes") {
      setFechaInicio(toDateInputValue(startOfMonth(base)));
      setFechaFin(toDateInputValue(startOfNextMonth(base)));
    } else {
      const anterior = new Date(base.getFullYear(), base.getMonth() - 1, 1);
      setFechaInicio(toDateInputValue(startOfMonth(anterior)));
      setFechaFin(toDateInputValue(startOfMonth(base)));
    }
  };

  const handleVincular = async (usuarioId: string, empleadoId: string) => {
    try {
      await vincularUsuario(empleadoId, usuarioId);
      toast({
        title: (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Vinculado
          </span>
        ),
        description: "El colaborador quedará asociado a esa cuenta",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: (
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Error al vincular
          </span>
        ),
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-semibold">Ventas por colaborador</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Cuánto vendió cada colaborador, con qué medio de pago y qué productos
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPreset("este-mes")}>
              Este mes
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreset("mes-anterior")}>
              Mes anterior
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            disabled={ventas.length === 0}
            onClick={() => exportVentasPorEmpleadoToExcel(ventas)}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total vendido en el período</p>
          <p className="text-2xl font-bold text-[hsl(var(--income))] tabular-nums">{formatMoney(totalGeneral)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Colaboradores con ventas</p>
          <p className="text-2xl font-bold">{ventas.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Top del período</p>
          <p className="text-lg font-bold truncate">
            {topVendedor ? topVendedor.nombreMostrado : "—"}
          </p>
          {topVendedor && (
            <p className="text-sm text-[hsl(var(--income))] font-semibold tabular-nums">
              {formatMoney(topVendedor.totalVendido)}
            </p>
          )}
        </Card>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Cargando…</div>
      ) : ventas.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No hay ventas registradas con vendedor asignado en este período.
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-sm">Ranking del período</h3>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(180, ventas.length * 40)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatMoney(v)} />
                <YAxis type="category" dataKey="nombre" width={110} />
                <Tooltip formatter={(value: number) => [formatMoney(value), "Total vendido"]} />
                <Bar dataKey="total" fill="#9333ea" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Total vendido</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Medios de pago</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((v) => (
                  <TableRow key={v.usuarioId}>
                    <TableCell className="font-medium">
                      {v.nombreMostrado}
                      {!v.empleadoId && (
                        <div className="mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-normal">
                            Sin vincular a un colaborador de nómina
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-[hsl(var(--income))] tabular-nums">
                      {formatMoney(v.totalVendido)}
                    </TableCell>
                    <TableCell>{v.cantidadUnidades}</TableCell>
                    <TableCell>{v.cantidadVentas}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.porMetodoPago).map(([metodo, monto]) => (
                          <Badge key={metodo} variant="secondary" className="text-[10px]">
                            {metodoPagoLabel(metodo)}: {formatMoney(monto)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDetalleEmpleado(v)}>
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <Dialog open={!!detalleEmpleado} onOpenChange={(open) => !open && setDetalleEmpleado(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detalleEmpleado?.nombreMostrado}</DialogTitle>
          </DialogHeader>
          {detalleEmpleado && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total vendido</span>
                <span className="font-bold text-[hsl(var(--income))] tabular-nums">
                  {formatMoney(detalleEmpleado.totalVendido)}
                </span>
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {detalleEmpleado.porProducto.map((p, i) => (
                  <div
                    key={`${p.productoId ?? "sin-id"}-${i}`}
                    className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                  >
                    <span className="truncate mr-2">
                      {p.productoNombre} <span className="text-muted-foreground">×{p.cantidad}</span>
                    </span>
                    <span className="font-medium shrink-0">{formatMoney(p.total)}</span>
                  </div>
                ))}
                {detalleEmpleado.porProducto.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin productos en el período</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {empleadosDisponibles.length > 0 && usuarios && usuarios.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Vincular cuentas a colaboradores</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Asociá cada cuenta de acceso (login) con el colaborador de nómina correspondiente para
            que el reporte muestre su nombre completo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-2">
                <span className="truncate">
                  {u.username} <span className="text-muted-foreground text-xs">({u.rol})</span>
                </span>
                <Select onValueChange={(empleadoId) => handleVincular(u.id, empleadoId)}>
                  <SelectTrigger className="h-8 text-xs w-[160px]">
                    <SelectValue placeholder="Colaborador…" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleadosDisponibles.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre} {e.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
