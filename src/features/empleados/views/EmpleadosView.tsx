import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useEmpleados,
  useJornadasEmpleado,
  useSemanasEmpleado,
} from "@/features/empleados/hooks/use-empleados";
import * as empleadosApi from "@/mocks/empleados";
import type { Empleado } from "@/mocks/empleados";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonday(weekOffset: number): Date {
  const d = new Date();
  const dow = d.getDay(); // 0=Dom
  const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
  d.setDate(diff + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const formatPeso = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

// ─── Tab: Empleados ───────────────────────────────────────────────────────────

function EmpleadosTab() {
  const { toast } = useToast();
  const { empleados, isLoading, agregarEmpleado, desactivarEmpleado, isAgregando } =
    useEmpleados();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    salario_por_hora: "",
    horas_dia_completo: "8",
  });
  const [verNuevo, setVerNuevo] = useState(false);

  const setField = useCallback(
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value })),
    []
  );

  const handleAgregar = async () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.salario_por_hora) {
      toast({ title: "Completá nombre, apellido y salario por hora", variant: "destructive" });
      return;
    }
    const salario = parseFloat(form.salario_por_hora);
    const horas = parseFloat(form.horas_dia_completo) || 8;
    if (!Number.isFinite(salario) || salario <= 0) {
      toast({ title: "El salario por hora tiene que ser mayor a 0", variant: "destructive" });
      return;
    }
    if (horas <= 0 || horas > 24) {
      toast({ title: "Las horas por día tienen que estar entre 1 y 24", variant: "destructive" });
      return;
    }
    try {
      await agregarEmpleado({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        salario_por_hora: salario,
        horas_dia_completo: horas,
      });
      toast({ title: "Colaborador agregado" });
      setForm({ nombre: "", apellido: "", dni: "", telefono: "", salario_por_hora: "", horas_dia_completo: "8" });
    } catch {
      toast({ title: "Error al agregar colaborador", variant: "destructive" });
    }
  };

  const handleDesactivar = async (id: string, nombre: string) => {
    try {
      await desactivarEmpleado(id);
      toast({ title: `${nombre} dado de baja` });
    } catch {
      toast({ title: "Error al dar de baja", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <button
          type="button"
          onClick={() => setVerNuevo((v) => !v)}
          className="w-full text-left"
          aria-expanded={verNuevo}
        >
          <CardHeader className="pb-6 flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo colaborador
            </CardTitle>
            {verNuevo ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </CardHeader>
        </button>
        {verNuevo && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre *</Label>
              <Input placeholder="Juan" value={form.nombre} onChange={setField("nombre")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Apellido *</Label>
              <Input placeholder="García" value={form.apellido} onChange={setField("apellido")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">DNI</Label>
              <Input placeholder="12345678" value={form.dni} onChange={setField("dni")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono</Label>
              <Input placeholder="11 1234-5678" value={form.telefono} onChange={setField("telefono")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Salario por hora ($ ARS) *</Label>
              <Input
                type="number"
                min={1}
                step="any"
                placeholder="1500"
                value={form.salario_por_hora}
                onChange={setField("salario_por_hora")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Horas por día completo</Label>
              <Input
                type="number"
                min={1}
                max={24}
                step="any"
                placeholder="8"
                value={form.horas_dia_completo}
                onChange={setField("horas_dia_completo")}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAgregar}
            disabled={isAgregando || !form.nombre.trim() || !form.apellido.trim() || !form.salario_por_hora}
          >
            {isAgregando ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Agregar colaborador
          </Button>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Colaboradores activos
            </CardTitle>
            {!isLoading && <Badge variant="secondary">{empleados.length}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : empleados.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin colaboradores registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {empleados.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-4 hover:bg-accent/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {emp.apellido}, {emp.nombre}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatPeso(emp.salario_por_hora)}/hora
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {emp.horas_dia_completo}hs/día
                      </span>
                      {emp.telefono && (
                        <span className="text-xs text-muted-foreground">{emp.telefono}</span>
                      )}
                      {emp.dni && (
                        <span className="text-xs text-muted-foreground">DNI {emp.dni}</span>
                      )}
                    </div>
                  </div>
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
                        <AlertDialogTitle>¿Dar de baja a {emp.nombre}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          El colaborador quedará inactivo. Sus jornadas y pagos se conservan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDesactivar(emp.id, emp.nombre)}
                        >
                          Dar de baja
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Jornadas ────────────────────────────────────────────────────────────

type TipoJornada = "completo" | "medio" | "falta";

const TIPO_CONFIG: Record<
  TipoJornada,
  { label: string; active: string; hover: string }
> = {
  completo: {
    label: "Completo",
    active: "bg-green-500 text-white border-green-500 hover:bg-green-600",
    hover: "hover:bg-green-50 dark:hover:bg-green-950/30",
  },
  medio: {
    label: "½ Día",
    active: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600",
    hover: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
  falta: {
    label: "Falta",
    active: "bg-red-500 text-white border-red-500 hover:bg-red-600",
    hover: "hover:bg-red-50 dark:hover:bg-red-950/30",
  },
};

function JornadasTab({ empleados }: { empleados: Empleado[] }) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => getMonday(weekOffset), [weekOffset]);
  const weekDates = useMemo(() => getWeekDates(monday), [monday]);
  const semanaInicio = toDateStr(weekDates[0]);
  const semanaFin = toDateStr(weekDates[weekDates.length - 1]);

  const {
    jornadas,
    isLoading,
    registrarJornada,
    eliminarJornada,
    calcularSemana,
    isRegistrando,
    isCalculando,
  } = useJornadasEmpleado(selectedId || null, semanaInicio, semanaFin);

  const { semanas, marcarPagada } = useSemanasEmpleado(selectedId || null);

  // Auto-registrar como "completo" los días de la semana que no tengan jornada
  const jornadaMap = useMemo(() => {
    const map: Record<string, (typeof jornadas)[0]> = {};
    jornadas.forEach((j) => { map[j.fecha] = j; });
    return map;
  }, [jornadas]);

  const semanActual = semanas.find((s) => s.semana_inicio === semanaInicio);

  const liveResumen = useMemo(() => {
    const emp = empleados.find((e) => e.id === selectedId);
    if (!emp || jornadas.length === 0) return null;
    const diasCompletos = jornadas.filter((j) => j.tipo === "completo" && !j.es_feriado).length;
    const mediosDias   = jornadas.filter((j) => j.tipo === "medio"    && !j.es_feriado).length;
    const faltas       = jornadas.filter((j) => j.tipo === "falta").length;
    const diasFeriado  = jornadas.filter((j) => j.es_feriado && j.tipo !== "falta").length;
    const horasNorm    = jornadas.filter((j) => !j.es_feriado && j.tipo !== "falta").reduce((s, j) => s + Number(j.horas), 0);
    const horasFer     = jornadas.filter((j) =>  j.es_feriado && j.tipo !== "falta").reduce((s, j) => s + Number(j.horas), 0);
    // Las faltas no suman horas (ya quedan excluidas de horasNorm/horasFer),
    // por eso NO se restan de nuevo: restarlas descontaría el día dos veces.
    const total =
      horasNorm * emp.salario_por_hora +
      horasFer  * emp.salario_por_hora * 2;
    return { diasCompletos, mediosDias, faltas, diasFeriado, total };
  }, [jornadas, selectedId, empleados]);

  const handleTipo = async (fecha: string, tipo: TipoJornada) => {
    if (!selectedId) return;
    const existing = jornadaMap[fecha];
    try {
      if (existing?.tipo === tipo) {
        await eliminarJornada(selectedId, fecha);
      } else {
        await registrarJornada({
          empleado_id: selectedId,
          fecha,
          tipo,
          es_feriado: existing?.es_feriado ?? false,
        });
      }
    } catch {
      toast({ title: "Error al registrar jornada", variant: "destructive" });
    }
  };

  const handleFeriado = async (fecha: string, checked: boolean) => {
    const existing = jornadaMap[fecha];
    if (!existing || !selectedId) return;
    try {
      await registrarJornada({
        empleado_id: selectedId,
        fecha,
        tipo: existing.tipo,
        es_feriado: checked,
      });
    } catch {
      toast({ title: "Error al actualizar jornada", variant: "destructive" });
    }
  };

  const handleMarcarPagada = async () => {
    if (!selectedId) return;
    try {
      await calcularSemana({ empleado_id: selectedId, semana_inicio: semanaInicio, semana_fin: semanaFin });
      const fresh = await empleadosApi.getSemanasEmpleado(selectedId, 10);
      const record = fresh.find((s) => s.semana_inicio === semanaInicio);
      if (record) await marcarPagada({ id: record.id });
      toast({ title: "Semana marcada como pagada" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const weekLabel = `${weekDates[0].getDate()}/${(weekDates[0].getMonth() + 1)
    .toString()
    .padStart(2, "0")} — ${weekDates[weekDates.length - 1].getDate()}/${(weekDates[weekDates.length - 1].getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;

  const todayStr = toDateStr(new Date());

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Seleccionar colaborador" />
          </SelectTrigger>
          <SelectContent>
            {empleados.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.apellido}, {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 min-w-[148px] font-normal"
            onClick={() => setWeekOffset(0)}
          >
            {weekOffset === 0 ? "Semana actual" : weekLabel}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!selectedId ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm">Seleccioná un colaborador para ver sus jornadas</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Week grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {weekDates.map((date, i) => {
              const dateStr = toDateStr(date);
              const jornada = jornadaMap[dateStr];
              const isToday = todayStr === dateStr;

              return (
                <div
                  key={dateStr}
                  className={[
                    "rounded-lg border p-4 space-y-3 transition-colors",
                    isToday ? "border-primary/50 bg-primary/5" : "",
                    jornada?.es_feriado && !isToday
                      ? "border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {DAY_NAMES[i]}
                    </p>
                    <p className={`text-sm font-bold ${isToday ? "text-primary" : ""}`}>
                      {date.getDate()}/{(date.getMonth() + 1).toString().padStart(2, "0")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {(["completo", "medio", "falta"] as TipoJornada[]).map((tipo) => {
                      const cfg = TIPO_CONFIG[tipo];
                      const isActive = jornada?.tipo === tipo;
                      return (
                        <button
                          key={tipo}
                          disabled={isRegistrando}
                          onClick={() => handleTipo(dateStr, tipo)}
                          className={[
                            "w-full text-[10px] font-medium py-1 px-1.5 rounded border transition-colors",
                            isActive ? cfg.active : `border-border ${cfg.hover}`,
                          ].join(" ")}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  {jornada && (
                    <div className="flex items-center gap-1.5 pt-1 border-t">
                      <Switch
                        id={`feriado-${dateStr}`}
                        checked={jornada.es_feriado}
                        onCheckedChange={(checked) => handleFeriado(dateStr, checked)}
                        className="scale-75 origin-left"
                      />
                      <Label
                        htmlFor={`feriado-${dateStr}`}
                        className="text-[9px] text-muted-foreground cursor-pointer leading-none"
                      >
                        Feriado
                      </Label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {liveResumen ? (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{liveResumen.diasCompletos}</span> completos
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{liveResumen.mediosDias}</span> medios
                    </span>
                    {liveResumen.faltas > 0 && (
                      <span className="text-red-600 font-medium">-{liveResumen.faltas} faltas</span>
                    )}
                    {liveResumen.diasFeriado > 0 && (
                      <span className="text-amber-600 font-medium">{liveResumen.diasFeriado} feriados ×2</span>
                    )}
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <span className="font-bold text-base">{formatPeso(liveResumen.total)}</span>
                    {semanActual?.pagado && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Pagado
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Cargando jornadas...</p>
                )}

                {liveResumen && !semanActual?.pagado && (
                  <Button size="sm" onClick={handleMarcarPagada}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar pagado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Tab: Historial de pagos ──────────────────────────────────────────────────

function PagosTab({ empleados }: { empleados: Empleado[] }) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("");
  const { semanas, isLoading, marcarPagada } = useSemanasEmpleado(selectedId || null);

  const handlePagar = async (id: string) => {
    try {
      await marcarPagada({ id });
      toast({ title: "Semana marcada como pagada" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Seleccionar colaborador" />
        </SelectTrigger>
        <SelectContent>
          {empleados.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.apellido}, {e.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedId ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm">Seleccioná un colaborador para ver su historial</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : semanas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Sin semanas calculadas. Usá la pestaña Jornadas para registrar y calcular.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {semanas.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {s.semana_inicio} → {s.semana_fin}
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{s.dias_completos} completos</span>
                  <span>{s.medios_dias} medios</span>
                  {s.faltas > 0 && (
                    <span className="text-red-600">-{s.faltas} faltas</span>
                  )}
                  {s.dias_feriado > 0 && (
                    <span className="text-amber-600">{s.dias_feriado} feriados</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatPeso(s.total_a_pagar)}</span>
                {s.pagado ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pagado{s.fecha_pago ? ` ${s.fecha_pago}` : ""}
                  </Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handlePagar(s.id)}>
                    Marcar pagado
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View principal ───────────────────────────────────────────────────────────

export default function EmpleadosView() {
  const { empleados } = useEmpleados();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-base font-semibold">Colaboradores</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestioná tu equipo, registrá jornadas y calculá pagos semanales
        </p>
      </div>

      <Tabs defaultValue="empleados">
        <TabsList>
          <TabsTrigger value="empleados">Colaboradores</TabsTrigger>
          <TabsTrigger value="jornadas">Jornadas</TabsTrigger>
          <TabsTrigger value="pagos">Historial de pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="empleados" className="mt-4">
          <EmpleadosTab />
        </TabsContent>

        <TabsContent value="jornadas" className="mt-4">
          <JornadasTab empleados={empleados} />
        </TabsContent>

        <TabsContent value="pagos" className="mt-4">
          <PagosTab empleados={empleados} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
