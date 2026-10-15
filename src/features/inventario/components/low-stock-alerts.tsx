

import { useState, useEffect } from "react";
import { getClientesDeudaVencida } from "@/mocks/clientes";
import { getStockBajo } from "@/mocks/movements";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResponsiveTable } from "@/shared/components/common/responsive-table";
import { useToast } from "@/hooks/use-toast";
import type { StockAlert } from "@/shared/types/inventory";
import {
  AlertTriangle,
  Package,
  CheckCircle,
  TrendingDown,
  RefreshCw,
  Users,
  Eye,
  Clock,
  DollarSign,
  ShoppingCart,
} from "lucide-react";

//  Tipos

interface ProductoVenta {
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  pagado: boolean;
}

interface VentaConProductos {
  id: number;
  fecha: string;
  total: number;
  saldo_pendiente: number;
  productos: ProductoVenta[];
}

interface ClienteDeuda {
  id: number;
  nombre: string;
  telefono: string | null;
  deuda_total: number;
  deuda_mas_antigua_sin_pagar: string;
  cantidad_ventas_impagas: number;
  ventas: VentaConProductos[];
}

//  Helpers compartidos

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatMonto = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

//  Página principal

export default function AlertasPage() {
  const [seccion, setSeccion] = useState<"stock" | "clientes">("clientes");

  const navItems = [
    { id: "clientes", label: "Deudas Vencidas", icon: Users },
    { id: "stock", label: "Stock Bajo", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: tabs horizontales */}
      <div className="flex md:hidden border-b bg-card border-border">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = seccion === id;
          return (
            <button
              key={id}
              onClick={() => setSeccion(id as "stock" | "clientes")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-all ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Desktop: sidebar lateral */}
      <div className="hidden md:flex min-h-screen">
        <aside className="w-56 shrink-0 border-r p-4 flex flex-col gap-2 bg-card border-border">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = seccion === id;
            return (
              <button
                key={id}
                onClick={() => setSeccion(id as "stock" | "clientes")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          {seccion === "clientes" ? <ClientesDeudaPanel /> : <StockBajoPanel />}
        </main>
      </div>

      {/* Mobile: contenido */}
      <div className="md:hidden p-4">
        {seccion === "clientes" ? <ClientesDeudaPanel /> : <StockBajoPanel />}
      </div>
    </div>
  );
}

//  Panel de Clientes con Deuda

function ClientesDeudaPanel() {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<ClienteDeuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(30);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteDeuda | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      setClientes(await getClientesDeudaVencida(dias));
    } catch {
      toast({
        title: "No se pudieron cargar las deudas vencidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [dias]);

  const verDetalle = (cliente: ClienteDeuda) => {
    setClienteSeleccionado(cliente);
    setModalAbierto(true);
  };

  const diasOpciones = [30, 60, 90, 180, 365];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalDeuda = clientes.reduce((s, c) => s + c.deuda_total, 0);
  const totalVentasImpagas = clientes.reduce(
    (s, c) => s + c.cantidad_ventas_impagas,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Clientes con deuda vencida
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Ventas impagas con más de {dias} días de antigüedad
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Más de:</span>
          <div className="flex gap-1">
            {diasOpciones.map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  dias === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={cargarClientes}
            title="Actualizar"
            className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border transition-colors bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Clientes afectados
            </span>
          </div>
          <p className="text-2xl font-bold text-destructive">
            {clientes.length}
          </p>
        </div>
        <div className="p-4 rounded-lg border transition-colors bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Ventas impagas
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {totalVentasImpagas}
          </p>
        </div>
        <div className="p-4 rounded-lg border transition-colors bg-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Deuda total
            </span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {formatMonto(totalDeuda)}
          </p>
        </div>
      </div>

      {/* Tabla */}
      {clientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-[hsl(var(--income))]" />
            <p className="font-medium text-foreground">
              No hay clientes con deudas vencidas de más de {dias} días
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Cliente",
                      "Teléfono",
                      "Deuda total",
                      "Deuda más antigua",
                      "Ventas impagas",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 transition-colors border-border hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {c.nombre}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.telefono ?? (
                          <span className="italic opacity-40">
                            Sin teléfono
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-destructive">
                        {formatMonto(c.deuda_total)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 opacity-40" />
                          {formatFecha(c.deuda_mas_antigua_sin_pagar)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                        >
                          {c.cantidad_ventas_impagas}{" "}
                          {c.cantidad_ventas_impagas === 1 ? "venta" : "ventas"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => verDetalle(c)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal detalle ventas */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Ventas impagas {clienteSeleccionado?.nombre}
            </DialogTitle>
          </DialogHeader>

          {!clienteSeleccionado?.ventas?.length ? (
            <p className="text-sm py-4 text-center text-muted-foreground">
              No se encontraron ventas
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {clienteSeleccionado.ventas.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border bg-muted/40 border-border"
                >
                  {/* Cabecera de la venta */}
                  <div className="flex justify-between items-center p-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatFecha(v.fecha)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {formatMonto(v.total)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">
                        {formatMonto(v.saldo_pendiente)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        pendiente
                      </p>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="px-3 py-2 space-y-1">
                    {v.productos?.map((p, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs"
                      >
                        <span
                          className={`text-foreground ${p.pagado ? "line-through opacity-40" : ""}`}
                        >
                          {p.cantidad} {p.producto_nombre}
                        </span>
                        <span className="text-muted-foreground">
                          {formatMonto(p.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Total general */}
              <div className="flex justify-between items-center px-3 pt-3 mt-1 border-t font-semibold border-border text-foreground">
                <span>Total pendiente</span>
                <span className="text-destructive">
                  {formatMonto(
                    clienteSeleccionado.ventas.reduce(
                      (s, v) => s + v.saldo_pendiente,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

//  Panel de Stock Bajo (inline, sin componente externo)

function StockBajoPanel() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        setAlerts(await getStockBajo());
      } catch {
        toast({
          title: "No se pudieron cargar las alertas de stock",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const sortedAlerts = [...alerts].sort(
    (a, b) => a.currentStock - b.currentStock,
  );

  const columns = [
    {
      key: "product",
      label: "Producto",
      render: (product: any) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{product.name}</div>
          <div className="text-sm text-muted-foreground">{product.code}</div>
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "currentStock",
      label: "Stock Actual",
      render: (value: number) => (
        <div className="space-y-1">
          <Badge
            variant={value === 0 ? "destructive" : "secondary"}
            className={
              value === 0
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
            }
          >
            {value === 0 ? "SIN STOCK" : `${value} unidades`}
          </Badge>
          {value === 0 && (
            <div className="text-xs text-destructive">
              ¡Crítico!
            </div>
          )}
        </div>
      ),
    },
    {
      key: "minStock",
      label: "Stock Mínimo",
      render: (value: number) => (
        <span className="text-sm text-muted-foreground">
          {value} unidades
        </span>
      ),
    },
    {
      key: "difference",
      label: "Faltante",
      render: (value: number) => (
        <span
          className={`font-medium ${
            value > 10
              ? "text-destructive"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {value} unidades
        </span>
      ),
    },
  ];

  const AlertCard = ({ alert }: { alert: StockAlert }) => {
    const isOutOfStock = alert.currentStock === 0;
    const isUrgent = alert.difference > 10;
    return (
      <Card
        className={`transition-all duration-200 hover:shadow-lg ${
          isOutOfStock
            ? "border-destructive/30 bg-destructive/5"
            : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {alert.product.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {alert.product.code}
              </p>
              {alert.product.category && (
                <Badge variant="outline" className="text-xs mt-1">
                  {alert.product.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${
                  isOutOfStock
                    ? "text-destructive"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
              {isUrgent && (
                <Badge variant="destructive" className="text-xs">
                  URGENTE
                </Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Stock Actual
              </p>
              <Badge
                variant={isOutOfStock ? "destructive" : "secondary"}
                className={
                  isOutOfStock
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                }
              >
                {isOutOfStock ? "SIN STOCK" : `${alert.currentStock}`}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Stock Mínimo
              </p>
              <p className="font-semibold text-foreground">
                {alert.minStock}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Faltante
              </p>
              <p
                className={`font-semibold ${
                  isUrgent
                    ? "text-destructive"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {alert.difference} unidades
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Prioridad
              </p>
              <p
                className={`text-sm font-medium ${
                  isOutOfStock
                    ? "text-destructive"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {isOutOfStock ? "Crítica" : isUrgent ? "Alta" : "Media"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[hsl(var(--income))]" />
            Alertas de Stock Bajo
          </CardTitle>
          <CardDescription>Estado del inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[hsl(var(--income))]">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              Todos los productos tienen stock suficiente
            </p>
            <p className="text-sm mt-2 text-muted-foreground">
              No hay productos que requieran reposición inmediata
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const outOfStockCount = alerts.filter((a) => a.currentStock === 0).length;
  const urgentCount = alerts.filter((a) => a.difference > 10).length;
  const totalFaltante = alerts.reduce((s, a) => s + a.difference, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alertas de Stock Bajo
          <Badge
            variant="destructive"
            className="bg-destructive/10 text-destructive"
          >
            {alerts.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Productos que necesitan reposición urgente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border transition-colors bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Sin Stock
              </span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {outOfStockCount}
            </p>
            <p className="text-xs text-destructive/80">
              Productos críticos
            </p>
          </div>
          <div className="p-4 rounded-lg border transition-colors bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Urgentes
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {urgentCount}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              Prioridad alta
            </p>
          </div>
          <div className="p-4 rounded-lg border transition-colors bg-primary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Total Faltante
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {totalFaltante}
            </p>
            <p className="text-xs text-primary/80">
              Unidades necesarias
            </p>
          </div>
        </div>

        {isMobile ? (
          <div className="space-y-4">
            {sortedAlerts.map((alert, i) => (
              <AlertCard key={`${alert.product.id}-${i}`} alert={alert} />
            ))}
          </div>
        ) : (
          <ResponsiveTable data={sortedAlerts} columns={columns} />
        )}

        <div className="mt-6 p-4 rounded-lg border bg-muted/40 border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-foreground">
              Recomendaciones
            </span>
          </div>
          <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
            <li>Prioriza la reposición de productos sin stock (críticos)</li>
            <li>
              Considera aumentar el stock mínimo para productos de alta
              rotación
            </li>
            <li>Revisa los proveedores para optimizar tiempos de entrega</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
