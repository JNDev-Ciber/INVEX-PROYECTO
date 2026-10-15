
import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  BookOpen,
  Clock,
  User,
  Package,
  ShoppingBag,
  History,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MetodoPago } from "@/shared/types/inventory";
import { FACTOR_METODO_PAGO } from "@/shared/types/inventory";

const titleWithIcon = (Icon: LucideIcon, text: string) => (
  <span className="flex items-center gap-2">
    <Icon className="h-4 w-4" />
    {text}
  </span>
);
import {
  getBoletasPendientes,
  getHistorialBoletas,
  aprobarBoleta,
  asignarClienteBoleta,
  rechazarBoleta,
} from "@/mocks/boletas";
import { ClienteSelector } from "@/features/clientes/components/ClienteSelector";
import type { ClienteVenta } from "@/shared/types/inventory";

type BoletaPendiente = {
  id: string;
  numero: string;
  fecha: string;
  cliente_nombre?: string | null;
  cliente_cuit?: string | null;
  total: number;
  subtotal: number;
  creado_por: string;
  /** id del vendedor que la creó; la venta se le atribuye a él, no al cajero */
  creado_por_id?: string | null;
  cliente_id?: number | null;
  productos: Array<{
    producto_id: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }>;
};

type BoletaHistorial = BoletaPendiente & {
  estado: string;
  procesado_por: string;
  procesado_en: string;
};

type Tab = "cola" | "historial";

// Porcentajes derivados de los factores compartidos, solo para los carteles.
const DISCOUNT = Math.round((1 - FACTOR_METODO_PAGO.debito) * 100);
const SURCHARGE_CARD = Math.round((FACTOR_METODO_PAGO.tarjeta - 1) * 100);

function formatFecha(fechaStr: string): string {
  if (!fechaStr) return "";
  try {
    const normalized = fechaStr.endsWith("Z") ? fechaStr : fechaStr + "Z";
    return new Date(normalized).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fechaStr;
  }
}

interface ColaCajaPageProps {
  clientes?: any[];
  products?: any[];
  onAddVentaFiado?: (
    clienteId: number,
    productos: any[],
    atribucion?: { usuarioId?: string | null; usuarioNombre?: string | null }
  ) => Promise<{ success: boolean; ventaId: any; total: number }>;
  currentUser?: { username?: string; rol?: string } | null;
}

export default function ColaCajaPage({
  clientes = [],
  products = [],
  onAddVentaFiado,
  currentUser: propCurrentUser,
}: ColaCajaPageProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("cola");
  const [pendientes, setPendientes] = useState<BoletaPendiente[]>([]);
  const [historial, setHistorial] = useState<BoletaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username?: string } | null>(
    propCurrentUser || null
  );
  const [boletaSeleccionada, setBoletaSeleccionada] =
    useState<BoletaPendiente | null>(null);
  const [procesando, setProcesando] = useState(false);
  // Cliente de la boleta que se está aprobando. Arranca con el que eligió el
  // vendedor (o el que coincide por CUIT o nombre) y caja lo puede cambiar.
  const [clienteAprobacion, setClienteAprobacion] = useState<ClienteVenta | null>(null);

  const abrirAprobacion = (b: BoletaPendiente) => {
    const nombre = b.cliente_nombre?.trim();
    const cliente =
      clientes.find((c: any) => b.cliente_id != null && c.id === b.cliente_id) ??
      clientes.find(
        (c: any) =>
          (b.cliente_cuit && c.cuit === b.cliente_cuit) || (!!nombre && c.nombre === nombre)
      ) ??
      null;
    setClienteAprobacion(cliente);
    setBoletaSeleccionada(b);
  };

  // Guarda el cliente elegido en la boleta antes de aprobarla.
  const guardarClienteElegido = async (b: BoletaPendiente) => {
    const elegido = clienteAprobacion?.id ?? null;
    if (elegido !== (b.cliente_id ?? null)) {
      await asignarClienteBoleta(b.id, elegido);
    }
  };

  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
      setAllowed(propCurrentUser.rol === "caja");
      return;
    }
    try {
      const userRaw = localStorage.getItem("electrolux_user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      setAllowed(user?.rol === "caja");
      setCurrentUser(user);
    } catch {
      setAllowed(false);
    }
  }, [propCurrentUser]);

  useEffect(() => {
    if (!allowed) return;
    fetchPendientes();
  }, [allowed]);

  useEffect(() => {
    if (!allowed || tab !== "historial") return;
    fetchHistorial();
  }, [allowed, tab]);

  const fetchPendientes = async () => {
    try {
      const pendientes = await getBoletasPendientes();
      console.log("📦 Pendientes recibidos:", pendientes);
      setPendientes(pendientes);
    } catch (err) {
      console.error("❌ Error trayendo boletas pendientes:", err);
      toast({
        title: titleWithIcon(XCircle, "Error al traer boletas"),
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const historial = await getHistorialBoletas();
      console.log("📦 Historial recibido:", historial);
      setHistorial(historial);
    } catch (err) {
      console.error("❌ Error trayendo historial:", err);
      toast({
        title: titleWithIcon(XCircle, "Error al traer historial"),
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    const interval = setInterval(() => {
      fetchPendientes();
      if (tab === "historial") fetchHistorial();
    }, 5000);
    return () => clearInterval(interval);
  }, [allowed, tab]);

  const aprobarConMetodo = async (metodo: MetodoPago) => {
    if (!boletaSeleccionada) return;
    setProcesando(true);

    // CASO CUENTA CORRIENTE
    if (metodo === "cuenta_corriente") {
      try {
        if (!onAddVentaFiado) {
          toast({
            title: "Error",
            description: "Función de venta a cuenta corriente no disponible",
            variant: "destructive",
          });
          setProcesando(false);
          return;
        }

        const clienteEnBD = clienteAprobacion;
        if (!clienteEnBD) {
          toast({
            title: "Error",
            description: "Elegí el cliente para cuenta corriente",
            variant: "destructive",
          });
          setProcesando(false);
          return;
        }
        const clienteNombre = clienteEnBD.nombre;

        const productosVenta = (boletaSeleccionada.productos ?? []).map(
          (item) => ({
            productoId: (item as any).producto_id,
            cantidad: item.cantidad,
          })
        );

        // Verificar que todos los productos tengan ID
        const missingIds = productosVenta.filter((p) => !p.productoId);
        if (missingIds.length > 0) {
          toast({
            title: "Error",
            description: "Hay productos sin ID. Creá una nueva boleta.",
            variant: "destructive",
          });
          setProcesando(false);
          return;
        }

        await guardarClienteElegido(boletaSeleccionada);

        // La venta se le atribuye al vendedor que creó la boleta, no al
        // cajero que la aprueba.
        const resultado = await onAddVentaFiado(
          clienteEnBD.id,
          productosVenta,
          {
            usuarioId: boletaSeleccionada.creado_por_id ?? null,
            usuarioNombre: boletaSeleccionada.creado_por || null,
          }
        );

        if (!resultado?.success) {
          throw new Error("Error al registrar venta fiado");
        }

        await aprobarBoleta({
          id: boletaSeleccionada.id,
          procesadoPor: currentUser?.username ?? "",
          motivoPago: "Cuenta Corriente",
          totalFinal: boletaSeleccionada.total,
          metodoPagoCodigo: "cuenta_corriente",
        });

        toast({
          title: titleWithIcon(CheckCircle2, "Venta a cuenta corriente"),
          description: `$${boletaSeleccionada.total.toLocaleString()} debitado a ${clienteNombre}`,
          duration: 3000,
        });

        setPendientes((p) => p.filter((x) => x.id !== boletaSeleccionada.id));
        setBoletaSeleccionada(null);
        if (tab === "historial") fetchHistorial();
      } catch (err) {
        console.error("Error en cuenta corriente:", err);
        toast({
          title: titleWithIcon(XCircle, "Error"),
          description: err instanceof Error ? err.message : "Error al procesar",
          variant: "destructive",
        });
      } finally {
        setProcesando(false);
      }
      return;
    }

    // CASO DÉBITO/EFECTIVO, PRECIO DE LISTA y TARJETA
    const motivoMap: Record<MetodoPago, string> = {
      debito: `Débito/Efectivo -${DISCOUNT}%`,
      credito: "Crédito",
      tarjeta: `Tarjeta +${SURCHARGE_CARD}%`,
      cuenta_corriente: "Cuenta Corriente",
    };

    const factor = FACTOR_METODO_PAGO[metodo];
    const totalFinal = boletaSeleccionada.total * factor;

    try {
      await guardarClienteElegido(boletaSeleccionada);
      const data = await aprobarBoleta({
        id: boletaSeleccionada.id,
        procesadoPor: currentUser?.username ?? "",
        motivoPago: motivoMap[metodo],
        totalFinal,
        metodoPagoCodigo: metodo,
      });

      toast({
        title: titleWithIcon(CheckCircle2, "Boleta aprobada"),
        description: `${boletaSeleccionada.numero} — ${
          motivoMap[metodo]
        } - Total: $${totalFinal.toLocaleString()}`,
        duration: 3000,
      });
      setPendientes((p) => p.filter((x) => x.id !== boletaSeleccionada.id));
      setBoletaSeleccionada(null);
      if (tab === "historial") fetchHistorial();
    } catch (err) {
      toast({
        title: titleWithIcon(XCircle, "Error al aprobar"),
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setProcesando(false);
    }
  };

  const rechazar = async (id: string) => {
    try {
      await rechazarBoleta({
        id,
        procesadoPor: currentUser?.username ?? "",
      });
      toast({ title: "Boleta rechazada", duration: 2000 });
      setPendientes((p) => p.filter((x) => x.id !== id));
      if (tab === "historial") fetchHistorial();
    } catch {
      toast({ title: titleWithIcon(XCircle, "Error al rechazar"), variant: "destructive" });
    }
  };

  if (!allowed) {
    return (
      <div className="p-8 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">
          Acceso no permitido. Solo usuarios con rol Caja.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Cargando cola de caja...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchPendientes();
              if (tab === "historial") fetchHistorial();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Recargar
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("cola")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "cola"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="h-4 w-4 inline mr-1" /> Cola (
          {pendientes.length})
        </button>
        <button
          onClick={() => setTab("historial")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "historial"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4 inline mr-1" /> Historial
        </button>
      </div>

      {tab === "cola" && (
        <>
          {pendientes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle2 className="h-12 w-12 text-[hsl(var(--income))] mb-3" />
                <p className="text-lg font-medium">Todo al día</p>
                <p className="text-muted-foreground text-sm">
                  No hay boletas pendientes de cobro
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendientes.map((b) => (
                <Card key={b.id} className="border-l-4 border-l-amber-400">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base">{b.numero}</CardTitle>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[140px]">{b.cliente_nombre || "Sin cliente"}</span>
                            {b.cliente_cuit && <span className="hidden sm:inline">· {b.cliente_cuit}</span>}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {formatFecha(b.fecha)}
                          </span>
                          <span className="text-xs">
                            por <strong>{b.creado_por}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg sm:text-xl font-bold text-[hsl(var(--income))] tabular-nums">
                          ${b.total.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          c/débito: $
                          {Math.round(
                            b.total * FACTOR_METODO_PAGO.debito
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(b.productos ?? []).map((item, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {item.cantidad}x {item.nombre} · $
                          {item.precioUnitario.toLocaleString()}
                        </Badge>
                      ))}
                    </div>
                    <Separator className="mb-4" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => abrirAprobacion(b)}
                        className="bg-[hsl(var(--income))] hover:bg-[hsl(var(--income))]/90 text-[hsl(var(--income-foreground))] flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rechazar(b.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:w-auto"
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "historial" && (
        <>
          {loadingHistorial ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando historial...
            </div>
          ) : historial.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <History className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium">Sin historial</p>
                <p className="text-muted-foreground text-sm">
                  No hay boletas procesadas aún
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {historial.map((b) => (
                <Card
                  key={b.id}
                  className={`border-l-4 ${
                    b.estado === "aprobada"
                      ? "border-l-[hsl(var(--income))]"
                      : "border-l-destructive/60"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">{b.numero}</CardTitle>
                          <Badge
                            variant={
                              b.estado === "aprobada"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs flex items-center gap-1"
                          >
                            {b.estado === "aprobada" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {b.estado === "aprobada" ? "Aprobada" : "Rechazada"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {b.cliente_nombre || "Sin cliente"}
                          </span>
                          <span>
                            vendedor: <strong>{b.creado_por}</strong>
                          </span>
                          <span>
                            caja: <strong>{b.procesado_por}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatFecha(b.procesado_en)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-base font-bold tabular-nums ${
                            b.estado === "aprobada"
                              ? "text-[hsl(var(--income))]"
                              : "text-muted-foreground line-through"
                          }`}
                        >
                          ${b.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1">
                      {(b.productos ?? []).map((item, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {item.cantidad}x {item.nombre}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!boletaSeleccionada}
        onOpenChange={(open) => !open && setBoletaSeleccionada(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Cómo paga el cliente?</DialogTitle>
            <DialogDescription>
              {boletaSeleccionada?.numero} ·{" "}
              <strong>${boletaSeleccionada?.total.toLocaleString()}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <ClienteSelector
              value={clienteAprobacion}
              onChange={setClienteAprobacion}
              disabled={procesando}
            />
            <Button
              onClick={() => aprobarConMetodo("debito")}
              disabled={procesando}
              className="w-full h-14"
            >
              <div className="flex items-center gap-3 w-full">
                <Banknote className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold">Débito / Efectivo</div>
                  <div className="text-xs opacity-80">
                    -{DISCOUNT}% · $
                    {boletaSeleccionada
                      ? Math.round(
                          boletaSeleccionada.total * FACTOR_METODO_PAGO.debito
                        ).toLocaleString()
                      : 0}
                  </div>
                </div>
              </div>
            </Button>
            <Button
              onClick={() => aprobarConMetodo("credito")}
              disabled={procesando}
              variant="outline"
              className="w-full h-14"
            >
              <div className="flex items-center gap-3 w-full">
                <CreditCard className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold">Precio de Lista</div>
                  <div className="text-xs text-muted-foreground">
                    Sin ajuste · $
                    {boletaSeleccionada?.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </Button>
            <Button
              onClick={() => aprobarConMetodo("tarjeta")}
              disabled={procesando}
              className="w-full bg-violet-600 hover:bg-violet-700 h-14"
            >
              <div className="flex items-center gap-3 w-full">
                <CreditCard className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold">Tarjeta</div>
                  <div className="text-xs opacity-80">
                    +{SURCHARGE_CARD}% · $
                    {boletaSeleccionada
                      ? Math.round(
                          boletaSeleccionada.total *
                            FACTOR_METODO_PAGO.tarjeta
                        ).toLocaleString()
                      : 0}
                  </div>
                </div>
              </div>
            </Button>
            {clienteAprobacion && (
              <Button
                onClick={() => aprobarConMetodo("cuenta_corriente")}
                disabled={procesando}
                className="w-full bg-amber-600 hover:bg-amber-700 h-14"
              >
                <div className="flex items-center gap-3 w-full">
                  <BookOpen className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-bold">Cuenta Corriente</div>
                    <div className="text-xs opacity-80">
                      Queda pendiente de cobro
                    </div>
                  </div>
                </div>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
