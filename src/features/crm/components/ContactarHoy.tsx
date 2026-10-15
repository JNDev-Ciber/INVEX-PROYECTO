import { useMemo } from "react";
import { CalendarPlus, MessageCircle, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClienteCrm } from "@/mocks/crm";
import { formatPesos, linkWhatsApp } from "../lib/crm-format";

const TOPE = 6;

/** Link de WhatsApp con mensaje sugerido. */
function waConMensaje(telefono: string | null, mensaje: string): string | null {
  const base = linkWhatsApp(telefono);
  return base ? `${base}?text=${encodeURIComponent(mensaje)}` : null;
}

interface Item {
  cliente: ClienteCrm;
  detalle: string;
  mensaje: string;
}

function Lista({
  titulo,
  descripcion,
  items,
  onAbrirCliente,
  onAgendar,
  tonoDetalle,
}: {
  titulo: string;
  descripcion: string;
  items: Item[];
  onAbrirCliente: (id: number) => void;
  onAgendar: (cliente: { id: number; nombre: string }, texto: string) => void;
  tonoDetalle?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-sm font-semibold">
          {titulo} <span className="text-muted-foreground">({items.length})</span>
        </p>
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </div>
      <ul className="divide-y rounded-md border">
        {items.map(({ cliente, detalle, mensaje }) => {
          const wa = waConMensaje(cliente.telefono, mensaje);
          return (
            <li key={cliente.id} className="flex items-center gap-2 p-2.5">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onAbrirCliente(cliente.id)}
              >
                <p className="truncate text-sm font-medium">{cliente.nombre}</p>
                <p className={`truncate text-xs ${tonoDetalle ?? "text-muted-foreground"}`}>{detalle}</p>
              </button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="Agendar contacto"
                onClick={() => onAgendar({ id: cliente.id, nombre: cliente.nombre }, mensaje)}
              >
                <CalendarPlus className="h-4 w-4" />
              </Button>
              {wa ? (
                <Button
                  asChild
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-[#25D366] text-white hover:bg-[#20bd5a]"
                  title="Escribir por WhatsApp"
                >
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <span className="w-8 shrink-0 text-center text-[10px] text-muted-foreground">
                  sin tel.
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * "Para contactar hoy": convierte el CRM en una lista de acciones concretas.
 * Prioriza a quién llamar para vender más y para cobrar, con WhatsApp directo
 * (mensaje sugerido) y la opción de dejarlo agendado.
 */
export function ContactarHoy({
  clientes,
  onAbrirCliente,
  onAgendar,
}: {
  clientes: ClienteCrm[];
  onAbrirCliente: (id: number) => void;
  onAgendar: (cliente: { id: number; nombre: string }, texto: string) => void;
}) {
  const { dejaron, enfriando, deben } = useMemo(() => {
    const dejaron: Item[] = clientes
      .filter((c) => c.segmento === "inactivo" && c.compras > 0)
      .sort((a, b) => b.total_comprado - a.total_comprado)
      .slice(0, TOPE)
      .map((c) => ({
        cliente: c,
        detalle: `Hace ${c.dias_sin_comprar} días sin comprar · compró ${formatPesos(c.total_comprado)}`,
        mensaje: `¡Hola ${c.nombre.split(" ")[0]}! ¿Cómo andás? Hace un tiempo que no te vemos por el local, te queríamos invitar a pasar. ¿Buscás algo en particular?`,
      }));

    const enfriando: Item[] = clientes
      .filter((c) => c.segmento === "ocasional")
      .sort((a, b) => (b.dias_sin_comprar ?? 0) - (a.dias_sin_comprar ?? 0))
      .slice(0, TOPE)
      .map((c) => ({
        cliente: c,
        detalle: `Hace ${c.dias_sin_comprar} días sin comprar`,
        mensaje: `¡Hola ${c.nombre.split(" ")[0]}! ¿Todo bien? Nos acordamos de vos, ¿necesitás algo del local?`,
      }));

    const deben: Item[] = clientes
      .filter((c) => c.saldo_pendiente > 0)
      .sort((a, b) => b.saldo_pendiente - a.saldo_pendiente)
      .slice(0, TOPE)
      .map((c) => ({
        cliente: c,
        detalle: `Debe ${formatPesos(c.saldo_pendiente)}`,
        mensaje: `¡Hola ${c.nombre.split(" ")[0]}! Te escribo del local por el saldo pendiente de ${formatPesos(c.saldo_pendiente)}. ¿Coordinamos el pago?`,
      }));

    return { dejaron, enfriando, deben };
  }, [clientes]);

  const total = dejaron.length + enfriando.length + deben.length;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <PhoneCall className="h-4 w-4 text-primary" />
          Para contactar hoy
        </CardTitle>
        <CardDescription className="text-xs">
          A quién conviene escribir hoy para vender más y para cobrar. Tocá WhatsApp para mandarle un
          mensaje ya escrito, o el calendario para dejarlo agendado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Por ahora no hay clientes para contactar. A medida que carguen ventas, acá vas a ver a
            quién conviene llamar.
          </p>
        ) : (
          <div className="space-y-4">
            <Lista
              titulo="Dejaron de venir"
              descripcion="Buenos clientes que hace rato no compran. Un mensaje los puede traer de vuelta."
              items={dejaron}
              onAbrirCliente={onAbrirCliente}
              onAgendar={onAgendar}
            />
            <Lista
              titulo="Se están enfriando"
              descripcion="Compraban seguido y empezaron a espaciarse. Mejor contactarlos antes de perderlos."
              items={enfriando}
              onAbrirCliente={onAbrirCliente}
              onAgendar={onAgendar}
            />
            <Lista
              titulo="Para cobrar"
              descripcion="Clientes con saldo pendiente, del que más debe al que menos."
              items={deben}
              onAbrirCliente={onAbrirCliente}
              onAgendar={onAgendar}
              tonoDetalle="text-red-600 dark:text-red-400"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
