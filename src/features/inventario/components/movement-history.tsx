

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ResponsiveTable } from "@/shared/components/common/responsive-table";
import type { Movement, Product } from "@/shared/types/inventory";
import { exportMovementsReport } from "@/shared/lib/export-utils";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  History,
  FileSpreadsheet,
  Calendar,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MovementHistoryProps {
  movements: Movement[];
  products: Product[];
  onClearMovements?: () => Promise<void>;
}

export function MovementHistory({
  movements,
  products,
  onClearMovements,
}: MovementHistoryProps) {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const getArgentinaDateTime = () => {
    const now = new Date();
    // Convertir a hora de Argentina (UTC-3)
    return now.toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
  };
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  };

  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [isMobile, setIsMobile] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getAvailableMonths = () => {
    const months = movements.map((movement) => {
      const date = new Date(movement.date);
      return {
        value: `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`,
        label: date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
        }),
      };
    });

    const uniqueMonths = months
      .filter(
        (month, index, self) =>
          index === self.findIndex((m) => m.value === month.value)
      )
      .sort((a, b) => b.value.localeCompare(a.value));

    return uniqueMonths;
  };

  const availableMonths = getAvailableMonths();

  const filteredMovements = movements
    .filter((movement) => {
      const typeMatch = typeFilter === "all" || movement.type === typeFilter;

      // Filtro por fecha específica (día)
      if (selectedDate) {
        const movementDate = new Date(movement.date);
        const isSameDay =
          movementDate.getDate() === selectedDate.getDate() &&
          movementDate.getMonth() === selectedDate.getMonth() &&
          movementDate.getFullYear() === selectedDate.getFullYear();

        return typeMatch && isSameDay;
      }

      // Filtro por mes
      if (monthFilter === "all") return typeMatch;

      const movementMonth = new Date(movement.date);
      const filterMonth = `${movementMonth.getFullYear()}-${(
        movementMonth.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;

      return typeMatch && filterMonth === monthFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleClearMovements = async () => {
    if (!onClearMovements) {
      toast({
        title: (
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Función no disponible
          </span>
        ),
        description: "La función de limpiar movimientos no está implementada.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsClearing(true);
      await onClearMovements();

      toast({
        title: (
          <span className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Movimientos eliminados
          </span>
        ),
        description: "Todos los movimientos han sido eliminados exitosamente.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error al limpiar movimientos",
        description:
          "No se pudieron eliminar los movimientos. Intenta nuevamente.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsClearing(false);
    }
  };

  const totalEntradas = filteredMovements.filter(
    (m) => m.type === "entrada"
  ).length;
  const totalSalidas = filteredMovements.filter(
    (m) => m.type === "salida"
  ).length;
  const valorTotalEntradas = filteredMovements
    .filter((m) => m.type === "entrada")
    .reduce((sum, m) => {
      const value =
        m.valor_total ||
        (() => {
          const product = products.find((p) => p.id === m.productId);
          return (product?.price || 0) * m.quantity;
        })();
      return sum + value;
    }, 0);

  const valorTotalSalidas = filteredMovements
    .filter((m) => m.type === "salida")
    .reduce((sum, m) => {
      const value =
        m.valor_total ||
        (() => {
          const product = products.find((p) => p.id === m.productId);
          return (product?.price || 0) * m.quantity;
        })();
      return sum + value;
    }, 0);

  const balance = valorTotalEntradas - valorTotalSalidas;

  const columns = [
    {
      key: "date",
      label: "Fecha",
      render: (value: string) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            {new Date(value).toLocaleDateString("es-ES")}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(value).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      key: "product",
      label: "Producto",
      render: (_: any, movement: Movement) => {
        const product = products.find((p) => p.id === movement.productId);
        const displayName =
          movement.productId === null
            ? movement.reason || "Pago de cliente"
            : product?.name || movement.productName || "Producto eliminado";

        return (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{displayName}</div>
            {(product?.code || movement.productCode) && (
              <div className="text-sm text-muted-foreground">
                {product?.code || movement.productCode}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Tipo",
      render: (value: "entrada" | "salida", item: Movement) => item?.esTransferencia ? (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <ArrowLeftRight className="h-3 w-3" />
          Transferencia
        </Badge>
      ) : (
        <Badge
          variant={value === "entrada" ? "default" : "secondary"}
          className={`flex items-center gap-1 w-fit ${
            value === "entrada"
              ? "bg-[hsl(var(--income))]/15 text-[hsl(var(--income))]"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {value === "entrada" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {value === "entrada" ? "Entrada" : "Salida"}
        </Badge>
      ),
    },
    {
      key: "quantity",
      label: "Cantidad",
      render: (value: number) => (
        <span className="font-medium text-foreground tabular-nums">
          {value.toString()}
        </span>
      ),
    },
    {
      key: "reason",
      label: "Motivo",
      render: (value: string) => (
        <span className="text-sm text-muted-foreground" title={value}>
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </span>
      ),
    },
    {
      key: "stockChange",
      label: "Cambio de Stock",
      render: (_: any, movement: Movement) => (
        <span className="text-sm font-mono text-muted-foreground tabular-nums">
          {movement.previousQuantity} → {movement.newQuantity}
        </span>
      ),
    },
    {
      key: "value",
      label: "Valor",
      render: (_: any, movement: Movement) => {
        const value =
          movement.valor_total ||
          (() => {
            const product = products.find((p) => p.id === movement.productId);
            return (product?.price || 0) * movement.quantity;
          })();

        return (
          <span
            className={`font-medium tabular-nums ${
              movement.type === "entrada"
                ? "text-[hsl(var(--income))]"
                : "text-destructive"
            }`}
          >
            ${value.toLocaleString("es-ES")}
          </span>
        );
      },
    },
  ];

  const MovementCard = ({ movement }: { movement: Movement }) => {
    const product = products.find((p) => p.id === movement.productId);
    const value =
      movement.valor_total || (product?.price || 0) * movement.quantity;
    const displayName = movement.productId
      ? product?.name || movement.productName || "Producto eliminado"
      : movement.reason || "Pago de cliente";

    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{displayName}</h3>
              <p className="text-sm text-muted-foreground">
                {product?.code || movement.productCode}
              </p>
            </div>
            {movement.esTransferencia ? (
              <Badge variant="outline">
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Transferencia
              </Badge>
            ) : (
            <Badge
              variant={movement.type === "entrada" ? "default" : "secondary"}
              className={
                movement.type === "entrada"
                  ? "bg-[hsl(var(--income))]/15 text-[hsl(var(--income))]"
                  : "bg-destructive/15 text-destructive"
              }
            >
              {movement.type === "entrada" ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {movement.type === "entrada" ? "Entrada" : "Salida"}
            </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground/70">Cantidad</p>
              <p className="font-semibold text-foreground tabular-nums">
                {movement.quantity}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/70">Valor</p>
              <p
                className={`font-semibold tabular-nums ${
                  movement.type === "entrada"
                    ? "text-[hsl(var(--income))]"
                    : "text-destructive"
                }`}
              >
                ${value.toLocaleString("es-ES")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/70">Stock</p>
              <p className="text-sm font-mono text-muted-foreground tabular-nums">
                {movement.previousQuantity} → {movement.newQuantity}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/70">Fecha</p>
              <p className="text-sm text-muted-foreground">
                {new Date(movement.date).toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">Motivo</p>
            <p className="text-sm text-muted-foreground">{movement.reason}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Movimientos
        </CardTitle>
        <CardDescription>
          Registro completo de entradas y salidas de stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          {/* Primera fila: Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los movimientos</SelectItem>
                <SelectItem value="entrada">Solo entradas</SelectItem>
                <SelectItem value="salida">Solo salidas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {month.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Nuevo DatePicker */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full sm:w-64 justify-start text-left font-normal ${
                    !selectedDate && "text-muted-foreground"
                  }`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Filtrar por día</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setDatePickerOpen(false);
                    if (date) {
                      setMonthFilter("all");
                    }
                  }}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Botón para limpiar filtro de fecha */}
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(undefined)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Segunda fila: Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                const movementsWithProductInfo = filteredMovements.map(
                  (movement) => {
                    const product = products.find(
                      (p) => p.id === movement.productId
                    );
                    return {
                      ...movement,
                      productName: product?.name || "Producto eliminado",
                      productCode: product?.code || "N/A",
                      value: (product?.price || 0) * movement.quantity,
                    };
                  }
                );

                exportMovementsReport(movementsWithProductInfo, products);
                toast({
                  title: "Movimientos exportados a CSV",
                  description:
                    "El archivo se descargó correctamente para Excel.",
                  duration: 3000,
                });
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar a Excel</span>
              <span className="sm:hidden">Exportar</span>
            </Button>

            {onClearMovements && movements.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isClearing}
                    className="flex items-center gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Limpiar Movimientos
                    </span>
                    <span className="sm:hidden">Limpiar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      ¿Eliminar todos los movimientos?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente todos los
                      movimientos del historial.
                      <br />
                      <br />
                      <strong>ADVERTENCIA:</strong> Esta acción no se puede
                      deshacer y eliminará:
                      <ul className="list-disc pl-5 mt-2">
                        <li>{movements.length} movimientos registrados</li>
                        <li>Todo el historial de entradas y salidas</li>
                        <li>Los datos de trazabilidad del inventario</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearMovements}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Sí, eliminar todos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Resumen de movimientos: un total destacado + el resto como
            linea simple, en vez de 4 tarjetas identicas repetidas. */}
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3 mb-6 pb-5 border-b">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <p
              className={`text-3xl font-bold tabular-nums ${
                balance >= 0 ? "text-[hsl(var(--income))]" : "text-destructive"
              }`}
            >
              ${balance.toLocaleString("es-ES")}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <ArrowUp className="h-4 w-4 text-[hsl(var(--income))]" />
            <span className="text-muted-foreground">Entradas</span>
            <span className="font-semibold tabular-nums">{totalEntradas}</span>
            <span className="text-muted-foreground tabular-nums">
              (${valorTotalEntradas.toLocaleString("es-ES")})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <ArrowDown className="h-4 w-4 text-destructive" />
            <span className="text-muted-foreground">Salidas</span>
            <span className="font-semibold tabular-nums">{totalSalidas}</span>
            <span className="text-muted-foreground tabular-nums">
              (${valorTotalSalidas.toLocaleString("es-ES")})
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredMovements.length} movimiento
            {filteredMovements.length !== 1 ? "s" : ""} en total
          </div>
        </div>

        {filteredMovements.length > 0 ? (
          isMobile ? (
            <div className="space-y-4">
              {filteredMovements.map((movement, index) => (
                <MovementCard
                  key={`${movement.productId}-${movement.date}-${index}`}
                  movement={movement}
                />
              ))}
            </div>
          ) : (
            <ResponsiveTable data={filteredMovements} columns={columns} />
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay movimientos registrados.</p>
            {(typeFilter !== "all" ||
              monthFilter !== "all" ||
              selectedDate) && (
              <p className="text-sm mt-2">
                Intenta cambiar los filtros para ver más movimientos.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
