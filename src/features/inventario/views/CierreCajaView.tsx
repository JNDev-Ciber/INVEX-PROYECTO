

import { useMemo, useState } from "react";
import { Wallet, Calendar as CalendarIcon, Banknote, ClipboardList } from "lucide-react";
import { isSameDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { useMovements } from "@/features/inventario/hooks/use-movements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

function formatMoney(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function esHoy(d: Date) {
  return isSameDay(d, new Date());
}

export default function CierreCajaView() {
  const { movements } = useMovements();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const resumen = useMemo(() => {
    const hoy = movements.filter((m) => isSameDay(new Date(m.date), selectedDate));

    // Ventas reales de hoy: tocan stock (quantity > 0) y son "entrada"
    // (convencion: entrada = venta). Separadas por metodo de pago.
    const ventasDebito = hoy.filter(
      (m) => m.quantity > 0 && m.type === "entrada" && m.metodoPago === "debito"
    );
    const ventasCredito = hoy.filter(
      (m) => m.quantity > 0 && m.type === "entrada" && m.metodoPago === "credito"
    );
    const ventasTarjeta = hoy.filter(
      (m) => m.quantity > 0 && m.type === "entrada" && m.metodoPago === "tarjeta"
    );
    // La venta a cuenta corriente se registra como "salida" (invex_agregar_venta_fiado),
    // a diferencia de las otras ventas que son "entrada": por eso no se filtra por tipo.
    const ventasCuentaCorriente = hoy.filter(
      (m) => m.quantity > 0 && m.metodoPago === "cuenta_corriente"
    );

    // Notas contables (no tocan stock, quantity === 0): cobros de deuda
    // vieja (entrada) y deuda manual nueva (salida). No son caja del dia
    // salvo el cobro, que si es plata real recibida hoy.
    const cobrosDeuda = hoy.filter(
      (m) => m.quantity === 0 && m.type === "entrada" && m.productId === null
    );
    const deudaManualNueva = hoy.filter(
      (m) => m.quantity === 0 && m.type === "salida" && m.productId === null
    );

    const sum = (arr: typeof hoy) =>
      arr.reduce((acc, m) => acc + (m.valor_total ?? 0), 0);

    const totalDebito = sum(ventasDebito);
    const totalCredito = sum(ventasCredito);
    const totalTarjeta = sum(ventasTarjeta);
    const totalCobrosDeuda = sum(cobrosDeuda);
    const totalIngresosReales =
      totalDebito + totalCredito + totalTarjeta + totalCobrosDeuda;

    const totalCuentaCorrienteHoy = sum(ventasCuentaCorriente);
    const totalDeudaManualHoy = sum(deudaManualNueva);

    return {
      totalDebito,
      totalCredito,
      totalTarjeta,
      totalCobrosDeuda,
      totalIngresosReales,
      totalCuentaCorrienteHoy,
      totalDeudaManualHoy,
      countDebito: ventasDebito.length,
      countCredito: ventasCredito.length,
      countTarjeta: ventasTarjeta.length,
      countCobrosDeuda: cobrosDeuda.length,
      countCuentaCorriente: ventasCuentaCorriente.length,
      countDeudaManual: deudaManualNueva.length,
    };
  }, [movements, selectedDate]);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold">Cerrar Caja</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Resumen de plata real del día elegido. No cierra ni bloquea nada, es
          solo informativo.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-64 justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) setSelectedDate(date);
                setDatePickerOpen(false);
              }}
              disabled={(date) => date > new Date()}
              locale={es}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {!esHoy(selectedDate) && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
            Hoy
          </Button>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <h3 className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          Ingresos reales de {esHoy(selectedDate) ? "hoy" : "ese día"}
        </h3>
        <div className="flex justify-between text-sm">
          <span>Ventas Débito ({resumen.countDebito})</span>
          <span className="font-medium">{formatMoney(resumen.totalDebito)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Ventas a precio de lista ({resumen.countCredito})</span>
          <span className="font-medium">{formatMoney(resumen.totalCredito)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Ventas con Tarjeta ({resumen.countTarjeta})</span>
          <span className="font-medium">{formatMoney(resumen.totalTarjeta)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Cobros de cuenta corriente ({resumen.countCobrosDeuda})</span>
          <span className="font-medium">
            {formatMoney(resumen.totalCobrosDeuda)}
          </span>
        </div>
        <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
          <span>Total ingresos</span>
          <span className="text-emerald-600">
            {formatMoney(resumen.totalIngresosReales)}
          </span>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-2 bg-muted/40">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Aparte — esto NO es caja, es para cobrar después
        </h3>
        <div className="flex justify-between text-sm">
          <span>
            Ventas a cuenta corriente ese día ({resumen.countCuentaCorriente})
          </span>
          <span className="font-medium">
            {formatMoney(resumen.totalCuentaCorrienteHoy)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Deuda manual cargada ese día ({resumen.countDeudaManual})</span>
          <span className="font-medium">
            {formatMoney(resumen.totalDeudaManualHoy)}
          </span>
        </div>
      </div>

      <div className="rounded-lg border p-4 flex justify-between items-center">
        <span className="text-sm font-semibold">Balance del día</span>
        <span className="text-2xl font-bold text-emerald-600">
          {formatMoney(resumen.totalIngresosReales)}
        </span>
      </div>
    </div>
  );
}
