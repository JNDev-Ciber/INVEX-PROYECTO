import { useState, type ReactNode } from "react";
import {
  Globe,
  CheckCircle2,
  XCircle,
  Pencil,
  Clock,
  Package,
  History,
  ShoppingBag,
  Banknote,
  CreditCard,
  RefreshCw,
  MessageCircle,
  UserRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { linkWhatsApp } from "@/features/crm/lib/crm-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatFechaLocal } from "@/shared/lib/date";
import {
  usePedidosWebPendientes,
  useHistorialPedidosWeb,
} from "@/features/pedidos-web/hooks/use-pedidos-web";
import { EditarPedidoWebDialog } from "@/features/pedidos-web/components/EditarPedidoWebDialog";
import type { PedidoWeb } from "@/mocks/pedidos-web";

type Tab = "pendientes" | "historial";

const DISCOUNT = 10;

const METODO_PAGO_LABEL: Record<string, string> = {
  debito: "Débito/Efectivo",
  credito: "Crédito",
  mercadopago: "Mercado Pago",
};

// Estado del cobro online (solo pedidos que el cliente eligió pagar con Mercado Pago).
/** Nombre y contacto que dejó el cliente en la tienda. */
function ClientePedido({ pedido }: { pedido: PedidoWeb }) {
  if (!pedido.cliente_nombre) {
    return <p className="mt-1 text-xs text-muted-foreground">Sin datos del cliente</p>;
  }
  const wa = linkWhatsApp(pedido.cliente_telefono);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="flex items-center gap-1 font-medium">
        <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
        {pedido.cliente_nombre}
      </span>
      {pedido.cliente_telefono &&
        (wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-700 hover:underline dark:text-green-400"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {pedido.cliente_telefono}
          </a>
        ) : (
          <span className="text-muted-foreground">{pedido.cliente_telefono}</span>
        ))}
      {pedido.cliente_email && <span className="text-xs text-muted-foreground">{pedido.cliente_email}</span>}
    </div>
  );
}

function PagoBadge({ pedido }: { pedido: PedidoWeb }) {
  if (pedido.canal !== "mercadopago") return null;
  const estilos: Record<string, { texto: string; clase: string }> = {
    aprobado: { texto: "Pagado con Mercado Pago", clase: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
    pendiente: { texto: "Esperando pago de Mercado Pago", clase: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    rechazado: { texto: "Pago rechazado", clase: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
    reembolsado: { texto: "Pago devuelto", clase: "bg-muted text-muted-foreground" },
  };
  const e = estilos[pedido.pago_estado ?? "pendiente"] ?? estilos.pendiente;
  return (
    <Badge variant="outline" className={`text-xs border-0 ${e.clase}`}>
      {e.texto}
    </Badge>
  );
}

function formatFecha(fechaStr: string | null): string {
  return formatFechaLocal(fechaStr, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tarjeta de pedido con cuerpo colapsable. El encabezado (número, cliente,
 * total, estado) queda siempre visible; el detalle (carrito y botones) se
 * minimiza con el chevron. El chevron es un botón aparte porque el
 * encabezado puede tener un link de WhatsApp y no se puede anidar.
 */
function PedidoCardColapsable({
  className,
  header,
  total,
  headerClassName,
  defaultOpen = true,
  children,
}: {
  className?: string;
  header: ReactNode;
  total: ReactNode;
  headerClassName?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <Card className={className}>
      <CardHeader className={headerClassName ?? "pb-3"}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">{header}</div>
          <div className="flex items-start gap-2 shrink-0">
            {total}
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
              aria-label={abierto ? "Minimizar" : "Expandir"}
              aria-expanded={abierto}
            >
              {abierto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </CardHeader>
      {abierto && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

export default function PedidosWebView() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("pendientes");
  const [pedidoEditando, setPedidoEditando] = useState<PedidoWeb | null>(null);
  const [pedidoAprobando, setPedidoAprobando] = useState<PedidoWeb | null>(null);

  const {
    pedidos,
    isLoading,
    editarPedido,
    aprobarPedido,
    rechazarPedido,
    isEditando,
    isAprobando,
    isRechazando,
    sincronizarPagos,
    isSincronizando,
  } = usePedidosWebPendientes();

  // Pedidos que el cliente eligió pagar online y todavía no figuran pagados.
  const esperandoPago = pedidos.filter(
    (p) => p.canal === "mercadopago" && p.pago_estado !== "aprobado"
  );

  const handleSincronizar = async () => {
    try {
      const { mensaje } = await sincronizarPagos();
      toast({ title: "Pagos de Mercado Pago", description: mensaje });
    } catch (err) {
      toast({
        title: "No se pudieron consultar los pagos",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const { historial, isLoading: isLoadingHistorial } = useHistorialPedidosWeb(
    tab === "historial"
  );

  // Pagado con Mercado Pago: se aprueba al precio cobrado, sin elegir método.
  const handleAprobarPagado = async (pedido: PedidoWeb) => {
    try {
      await aprobarPedido(pedido.id, "mercadopago");
      toast({
        title: "Pedido aprobado",
        description: "Mercado Pago · Stock descontado y venta registrada",
      });
    } catch (err) {
      toast({
        title: "Error al aprobar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const handleAprobarConMetodo = async (metodoPago: "debito" | "credito") => {
    if (!pedidoAprobando) return;
    try {
      const carritoFinal =
        metodoPago === "debito"
          ? pedidoAprobando.carrito.map((item) => ({
              ...item,
              precio: Math.round(item.precio * (1 - DISCOUNT / 100)),
            }))
          : undefined;

      await aprobarPedido(pedidoAprobando.id, metodoPago, carritoFinal);
      toast({
        title: (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Pedido aprobado
          </span>
        ),
        description: `${METODO_PAGO_LABEL[metodoPago]} · Stock descontado y venta registrada`,
      });
      setPedidoAprobando(null);
    } catch (err) {
      toast({
        title: (
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Error al aprobar
          </span>
        ),
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const handleRechazar = async (pedido: PedidoWeb) => {
    const id = pedido.id;
    if (
      pedido.pago_estado === "aprobado" &&
      !window.confirm(
        "Este pedido ya está pagado con Mercado Pago. Si lo rechazás, tenés que devolver el dinero desde tu cuenta de Mercado Pago. ¿Rechazarlo igual?"
      )
    ) {
      return;
    }
    try {
      await rechazarPedido(id);
      toast({ title: "Pedido rechazado", duration: 2000 });
    } catch (err) {
      toast({
        title: (
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Error al rechazar
          </span>
        ),
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold">Pedidos Web</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pedidos del catálogo online. El stock se descuenta recién al aprobar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {esperandoPago.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleSincronizar} disabled={isSincronizando}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSincronizando ? "animate-spin" : ""}`} />
              Consultar pagos de Mercado Pago
            </Button>
          )}
          <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
            {pedidos.length} pendiente{pedidos.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="pendientes">
            <ShoppingBag className="h-4 w-4 mr-1" />
            Pendientes ({pedidos.length})
          </TabsTrigger>
          <TabsTrigger value="historial">
            <History className="h-4 w-4 mr-1" />
            Historial
          </TabsTrigger>
        </TabsList>

      <TabsContent value="pendientes" className="mt-4">
        <>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : pedidos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle2 className="h-12 w-12 text-[hsl(var(--income))] mb-3" />
                <p className="text-lg font-medium">Todo al día</p>
                <p className="text-muted-foreground text-sm">
                  No hay pedidos web pendientes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pedidos.map((p) => (
                <PedidoCardColapsable
                  key={p.id}
                  className="border-l-4 border-l-primary/60"
                  header={
                    <>
                      <CardTitle className="text-base">
                        Pedido #{p.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <ClientePedido pedido={p} />
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {formatFecha(p.creado_en)}
                      </div>
                      {p.canal === "mercadopago" && (
                        <div className="mt-2">
                          <PagoBadge pedido={p} />
                        </div>
                      )}
                    </>
                  }
                  total={
                    <div className="text-lg sm:text-xl font-bold text-blue-600 flex-shrink-0">
                      ${p.total.toLocaleString()}
                    </div>
                  }
                >
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.carrito.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {item.quantity}x {item.nombre} · ${item.precio.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="mb-4" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    {p.canal === "mercadopago" && p.pago_estado !== "aprobado" ? (
                      <Button
                        variant="outline"
                        onClick={handleSincronizar}
                        disabled={isSincronizando}
                        className="flex-1"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isSincronizando ? "animate-spin" : ""}`} />
                        Esperando pago · Consultar
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          p.canal === "mercadopago" ? handleAprobarPagado(p) : setPedidoAprobando(p)
                        }
                        disabled={isAprobando}
                        className="bg-[hsl(var(--income))] hover:bg-[hsl(var(--income))]/90 text-[hsl(var(--income-foreground))] flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {p.canal === "mercadopago" ? "Aprobar (ya pagado)" : "Aprobar"}
                      </Button>
                    )}
                    {p.canal !== "mercadopago" && (
                      <Button
                        variant="outline"
                        onClick={() => setPedidoEditando(p)}
                        className="sm:w-auto"
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleRechazar(p)}
                      disabled={isRechazando}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Rechazar
                    </Button>
                  </div>
                </PedidoCardColapsable>
              ))}
            </div>
          )}
        </>
      </TabsContent>

      <TabsContent value="historial" className="mt-4">
        <>
          {isLoadingHistorial ? (
            <div className="p-8 text-center text-muted-foreground">Cargando historial...</div>
          ) : historial.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <History className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium">Sin historial</p>
                <p className="text-muted-foreground text-sm">
                  No hay pedidos web procesados aún
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {historial.map((p) => (
                <PedidoCardColapsable
                  key={p.id}
                  className={`border-l-4 ${
                    p.estado === "aprobado" ? "border-l-[hsl(var(--income))]" : "border-l-destructive/60"
                  }`}
                  headerClassName="pb-2"
                  header={
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-sm">
                          Pedido #{p.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <Badge
                          variant={p.estado === "aprobado" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {p.estado === "aprobado" ? "Aprobado" : "Rechazado"}
                        </Badge>
                        <PagoBadge pedido={p} />
                      </div>
                      <ClientePedido pedido={p} />
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          por <strong>{p.procesado_por || "—"}</strong>
                        </span>
                        {p.metodo_pago && (
                          <span>{METODO_PAGO_LABEL[p.metodo_pago] ?? p.metodo_pago}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatFecha(p.procesado_en)}
                        </span>
                      </div>
                    </>
                  }
                  total={
                    <div
                      className={`text-base font-bold ${
                        p.estado === "aprobado"
                          ? "text-green-600"
                          : "text-muted-foreground line-through"
                      }`}
                    >
                      ${p.total.toLocaleString()}
                    </div>
                  }
                >
                  <div className="flex flex-wrap gap-1">
                    {p.carrito.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {item.quantity}x {item.nombre}
                      </Badge>
                    ))}
                  </div>
                </PedidoCardColapsable>
              ))}
            </div>
          )}
        </>
      </TabsContent>
      </Tabs>

      <EditarPedidoWebDialog
        pedido={pedidoEditando}
        open={!!pedidoEditando}
        onOpenChange={(open) => !open && setPedidoEditando(null)}
        onSave={editarPedido}
        isSaving={isEditando}
      />

      <Dialog
        open={!!pedidoAprobando}
        onOpenChange={(open) => !open && setPedidoAprobando(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Cómo paga el cliente?</DialogTitle>
            <DialogDescription>
              Pedido #{pedidoAprobando?.id.slice(0, 8).toUpperCase()} ·{" "}
              <strong>${pedidoAprobando?.total.toLocaleString()}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button
              onClick={() => handleAprobarConMetodo("debito")}
              disabled={isAprobando}
              className="w-full bg-[hsl(var(--income))] hover:bg-[hsl(var(--income))]/90 text-[hsl(var(--income-foreground))] h-14"
            >
              <div className="flex items-center gap-3 w-full">
                <Banknote className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold">Débito / Efectivo</div>
                  <div className="text-xs opacity-80">
                    -{DISCOUNT}% · $
                    {pedidoAprobando
                      ? Math.round(
                          pedidoAprobando.total * (1 - DISCOUNT / 100)
                        ).toLocaleString()
                      : 0}
                  </div>
                </div>
              </div>
            </Button>
            <Button
              onClick={() => handleAprobarConMetodo("credito")}
              disabled={isAprobando}
              variant="outline"
              className="w-full h-14"
            >
              <div className="flex items-center gap-3 w-full">
                <CreditCard className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold">Crédito</div>
                  <div className="text-xs text-muted-foreground">
                    Precio normal · ${pedidoAprobando?.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
