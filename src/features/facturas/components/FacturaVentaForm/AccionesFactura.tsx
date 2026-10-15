

import { Button } from "@/components/ui/button";
import { Banknote, BookOpen, CreditCard, Tag } from "lucide-react";
import type { FacturaVenta } from "./types";

interface Props {
  facturaActual: FacturaVenta;
  isVendedor: boolean;
  isFacturaLoading: boolean;
  isLoading: boolean;
  enviarBoletaPendienteHandler: () => Promise<void>;
  procesarFacturaVentaDebito: () => Promise<void>;
  procesarFacturaVentaCredito: () => Promise<void>;
  procesarFacturaVentaTarjeta: () => Promise<void>;
  handleDejarAFiado: () => Promise<void>;
  totalLista: number;
  totalConDebitoEfectivo: number;
  totalConTarjeta: number;
  DISCOUNT_PERCENT_CASH: number;
  SURCHARGE_PERCENT_CARD: number;
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function AccionesFactura({
  facturaActual,
  isVendedor,
  isFacturaLoading,
  isLoading,
  enviarBoletaPendienteHandler,
  procesarFacturaVentaDebito,
  procesarFacturaVentaCredito,
  procesarFacturaVentaTarjeta,
  handleDejarAFiado,
  totalLista,
  totalConDebitoEfectivo,
  totalConTarjeta,
  DISCOUNT_PERCENT_CASH,
  SURCHARGE_PERCENT_CARD,
}: Props) {
  // Las 4 formas de cobro comparten la misma validacion: sin items o sin
  // nombre de cliente no se puede cobrar de ninguna manera.
  const sinDatos =
    facturaActual.items.length === 0 || !facturaActual.cliente.nombre.trim();
  const cobroDeshabilitado = sinDatos || isFacturaLoading;

  return (
    <div className="flex flex-col items-center gap-3">
      {isVendedor ? (
        <div className="w-full max-w-2xl">
          <Button
            onClick={async () => {
              await enviarBoletaPendienteHandler?.();
            }}
            disabled={cobroDeshabilitado}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 w-full"
            size="lg"
          >
            Enviar a Caja
          </Button>
        </div>
      ) : null}

      {/* 👇 SOLO CAJA / ADMIN */}
      {!isVendedor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
          <Button
            onClick={procesarFacturaVentaCredito}
            disabled={cobroDeshabilitado}
            variant="outline"
            className="h-16 px-4"
            size="lg"
          >
            <div className="flex items-center gap-3 w-full">
              <Tag className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold">Precio de Lista</div>
                <div className="text-xs text-muted-foreground">
                  Sin ajuste · {money(totalLista)}
                </div>
              </div>
            </div>
          </Button>

          <Button
            onClick={procesarFacturaVentaDebito}
            disabled={cobroDeshabilitado}
            className="bg-blue-600 hover:bg-blue-700 h-16 px-4"
            size="lg"
          >
            <div className="flex items-center gap-3 w-full">
              <Banknote className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold">Efectivo</div>
                <div className="text-xs opacity-80">
                  -{DISCOUNT_PERCENT_CASH}% · {money(totalConDebitoEfectivo)}
                </div>
              </div>
            </div>
          </Button>

          <Button
            onClick={procesarFacturaVentaTarjeta}
            disabled={cobroDeshabilitado}
            className="bg-violet-600 hover:bg-violet-700 h-16 px-4"
            size="lg"
          >
            <div className="flex items-center gap-3 w-full">
              <CreditCard className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold">Tarjeta</div>
                <div className="text-xs opacity-80">
                  +{SURCHARGE_PERCENT_CARD}% · {money(totalConTarjeta)}
                </div>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleDejarAFiado}
            disabled={sinDatos || isLoading || isFacturaLoading}
            className="bg-amber-600 hover:bg-amber-700 h-16 px-4"
            size="lg"
          >
            <div className="flex items-center gap-3 w-full">
              <BookOpen className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold">Cuenta Corriente</div>
                <div className="text-xs opacity-80">
                  Queda pendiente · {money(totalLista)}
                </div>
              </div>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
