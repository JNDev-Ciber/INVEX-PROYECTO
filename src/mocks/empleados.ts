import { delay, fail, haceDias, uid } from "./db";

export interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  fecha_ingreso: string;
  salario_por_hora: number;
  horas_dia_completo: number;
  activo: boolean;
  created_at: string;
  usuario_id?: string | null;
}

export interface Jornada {
  id: string;
  empleado_id: string;
  fecha: string;
  tipo: "completo" | "medio" | "falta";
  es_feriado: boolean;
  horas: number;
  observaciones: string | null;
  created_at: string;
}

export interface SemanaPago {
  id: string;
  semana_inicio: string;
  semana_fin: string;
  dias_completos: number;
  medios_dias: number;
  faltas: number;
  dias_feriado: number;
  horas_normales: number;
  horas_feriado: number;
  monto_normal: number;
  monto_feriado: number;
  descuento_faltas: number;
  total_a_pagar: number;
  pagado: boolean;
  fecha_pago: string | null;
  notas: string | null;
}

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------

/** Fecha local YYYY-MM-DD. */
function fechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fechaHaceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return fechaLocal(d);
}

function lunesDe(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dow = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

const empleados: Empleado[] = [
  {
    id: "emp-1",
    nombre: "Martín",
    apellido: "Quiroga",
    dni: "33456789",
    telefono: "261 555-3001",
    email: "martin.quiroga@example.com",
    fecha_ingreso: fechaHaceDias(540),
    salario_por_hora: 4500,
    horas_dia_completo: 8,
    activo: true,
    created_at: haceDias(540, 9),
    usuario_id: "usr-vendedor1",
  },
  {
    id: "emp-2",
    nombre: "Lorena",
    apellido: "Videla",
    dni: "35123456",
    telefono: "261 555-3002",
    email: "lorena.videla@example.com",
    fecha_ingreso: fechaHaceDias(320),
    salario_por_hora: 4800,
    horas_dia_completo: 8,
    activo: true,
    created_at: haceDias(320, 9),
    usuario_id: "usr-caja1",
  },
  {
    id: "emp-3",
    nombre: "Facundo",
    apellido: "Molina",
    dni: "38987654",
    telefono: "261 555-3003",
    email: null,
    fecha_ingreso: fechaHaceDias(120),
    salario_por_hora: 4000,
    horas_dia_completo: 6,
    activo: true,
    created_at: haceDias(120, 9),
    usuario_id: null,
  },
];

const jornadas: Jornada[] = [];
const semanas: Array<SemanaPago & { empleado_id: string }> = [];

function horasDe(emp: Empleado, tipo: Jornada["tipo"]): number {
  if (tipo === "completo") return Number(emp.horas_dia_completo);
  if (tipo === "medio") return Number(emp.horas_dia_completo) / 2;
  return 0;
}

function upsertJornada(
  emp: Empleado,
  fecha: string,
  tipo: Jornada["tipo"],
  esFeriado: boolean,
  observaciones: string | null,
) {
  const horas = horasDe(emp, tipo);
  const existente = jornadas.find((j) => j.empleado_id === emp.id && j.fecha === fecha);
  if (existente) {
    existente.tipo = tipo;
    existente.es_feriado = esFeriado;
    existente.horas = horas;
    existente.observaciones = observaciones;
    return;
  }
  jornadas.push({
    id: uid("jor"),
    empleado_id: emp.id,
    fecha,
    tipo,
    es_feriado: esFeriado,
    horas,
    observaciones,
    created_at: new Date().toISOString(),
  });
}

function calcularSemana(emp: Empleado, semanaInicio: string, semanaFin: string): SemanaPago {
  const js = jornadas.filter(
    (j) => j.empleado_id === emp.id && j.fecha >= semanaInicio && j.fecha <= semanaFin,
  );
  const normales = js.filter((j) => !j.es_feriado && j.tipo !== "falta");
  const feriados = js.filter((j) => j.es_feriado && j.tipo !== "falta");
  const horasNormales = normales.reduce((s, j) => s + Number(j.horas), 0);
  const horasFeriado = feriados.reduce((s, j) => s + Number(j.horas), 0);
  const montoNormal = horasNormales * emp.salario_por_hora;
  const montoFeriado = horasFeriado * emp.salario_por_hora * 2;
  // Las faltas no suman horas, por lo que no hay nada extra que descontar.
  const descuentoFaltas = 0;
  const existente = semanas.find(
    (s) => s.empleado_id === emp.id && s.semana_inicio === semanaInicio,
  );
  const base: SemanaPago = {
    id: existente?.id ?? uid("sem"),
    semana_inicio: semanaInicio,
    semana_fin: semanaFin,
    dias_completos: js.filter((j) => j.tipo === "completo" && !j.es_feriado).length,
    medios_dias: js.filter((j) => j.tipo === "medio" && !j.es_feriado).length,
    faltas: js.filter((j) => j.tipo === "falta").length,
    dias_feriado: feriados.length,
    horas_normales: horasNormales,
    horas_feriado: horasFeriado,
    monto_normal: montoNormal,
    monto_feriado: montoFeriado,
    descuento_faltas: descuentoFaltas,
    total_a_pagar: montoNormal + montoFeriado - descuentoFaltas,
    pagado: existente?.pagado ?? false,
    fecha_pago: existente?.fecha_pago ?? null,
    notas: existente?.notas ?? null,
  };
  if (existente) Object.assign(existente, base);
  else semanas.push({ ...base, empleado_id: emp.id });
  return base;
}

function sembrar() {
  const lunesActual = lunesDe(new Date());
  const hoyStr = fechaLocal(new Date());
  // Ausencias puntuales: [empleado idx, dias atrás, tipo]
  const especiales: Record<string, Jornada["tipo"]> = {
    "emp-1|9": "medio",
    "emp-2|16": "falta",
    "emp-3|12": "medio",
    "emp-1|20": "falta",
  };
  for (const emp of empleados) {
    for (let dias = 21; dias >= 0; dias--) {
      const d = new Date();
      d.setDate(d.getDate() - dias);
      if (d.getDay() === 0) continue; // domingo no se trabaja
      const fecha = fechaLocal(d);
      if (fecha > hoyStr) continue;
      const tipo = especiales[`${emp.id}|${dias}`] ?? (d.getDay() === 6 ? "medio" : "completo");
      upsertJornada(emp, fecha, tipo, false, null);
    }
    // Semanas anteriores a la actual: calculadas; la más antigua ya pagada.
    for (let w = 3; w >= 1; w--) {
      const ini = new Date(lunesActual);
      ini.setDate(ini.getDate() - 7 * w);
      const fin = new Date(ini);
      fin.setDate(fin.getDate() + 6);
      const sIni = fechaLocal(ini);
      const sFin = fechaLocal(fin);
      if (!jornadas.some((j) => j.empleado_id === emp.id && j.fecha >= sIni && j.fecha <= sFin)) continue;
      const s = calcularSemana(emp, sIni, sFin);
      if (w >= 2) {
        const registro = semanas.find((x) => x.id === s.id)!;
        registro.pagado = true;
        registro.fecha_pago = fechaLocal(new Date(fin.getTime() + 2 * 86400000));
      }
    }
  }
}

sembrar();

function buscarEmpleado(id: string): Empleado {
  return empleados.find((e) => e.id === id) ?? fail("Empleado no encontrado");
}

/** Usado por otros mocks (ventas-empleados). */
export function empleadoIdPorUsuario(usuarioId: string): string | null {
  return empleados.find((e) => e.usuario_id === usuarioId && e.activo)?.id ?? null;
}

export function nombreEmpleadoPorUsuario(usuarioId: string): string | null {
  const e = empleados.find((x) => x.usuario_id === usuarioId);
  return e ? `${e.nombre} ${e.apellido}` : null;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getAllEmpleados(): Promise<Empleado[]> {
  const lista = empleados
    .filter((e) => e.activo)
    .map((e) => ({ ...e }))
    .sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));
  return delay(lista);
}

export async function agregarEmpleado(params: {
  nombre: string;
  apellido: string;
  dni?: string;
  telefono?: string;
  email?: string;
  salario_por_hora: number;
  horas_dia_completo: number;
}): Promise<string> {
  if (!params.nombre?.trim() || !params.apellido?.trim()) {
    fail("El nombre y el apellido son obligatorios");
  }
  const id = uid("emp");
  empleados.push({
    id,
    nombre: params.nombre.trim(),
    apellido: params.apellido.trim(),
    dni: params.dni || null,
    telefono: params.telefono || null,
    email: params.email || null,
    fecha_ingreso: fechaLocal(new Date()),
    salario_por_hora: params.salario_por_hora,
    horas_dia_completo: params.horas_dia_completo,
    activo: true,
    created_at: new Date().toISOString(),
    usuario_id: null,
  });
  return delay(id);
}

export async function editarEmpleado(params: {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string;
  telefono?: string;
  salario_por_hora: number;
  horas_dia_completo: number;
}): Promise<boolean> {
  const emp = buscarEmpleado(params.id);
  emp.nombre = params.nombre.trim();
  emp.apellido = params.apellido.trim();
  emp.dni = params.dni || null;
  emp.telefono = params.telefono || null;
  emp.salario_por_hora = params.salario_por_hora;
  emp.horas_dia_completo = params.horas_dia_completo;
  return delay(true);
}

export async function desactivarEmpleado(id: string): Promise<boolean> {
  buscarEmpleado(id).activo = false;
  return delay(true);
}

export async function registrarJornada(params: {
  empleado_id: string;
  fecha: string;
  tipo: "completo" | "medio" | "falta";
  es_feriado: boolean;
  observaciones?: string;
}): Promise<boolean> {
  const emp = buscarEmpleado(params.empleado_id);
  upsertJornada(emp, params.fecha, params.tipo, params.es_feriado, params.observaciones || null);
  return delay(true);
}

export async function eliminarJornada(empleadoId: string, fecha: string): Promise<boolean> {
  const idx = jornadas.findIndex((j) => j.empleado_id === empleadoId && j.fecha === fecha);
  if (idx >= 0) jornadas.splice(idx, 1);
  return delay(idx >= 0);
}

export async function getJornadasEmpleado(params: {
  empleado_id: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}): Promise<Jornada[]> {
  const lista = jornadas
    .filter(
      (j) =>
        j.empleado_id === params.empleado_id &&
        (!params.fecha_inicio || j.fecha >= params.fecha_inicio) &&
        (!params.fecha_fin || j.fecha <= params.fecha_fin),
    )
    .map((j) => ({ ...j }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  return delay(lista);
}

export async function calcularSemanaPago(params: {
  empleado_id: string;
  semana_inicio: string;
  semana_fin: string;
}): Promise<unknown> {
  const emp = buscarEmpleado(params.empleado_id);
  return delay({ ...calcularSemana(emp, params.semana_inicio, params.semana_fin) });
}

export async function getSemanasEmpleado(empleadoId: string, limite = 10): Promise<SemanaPago[]> {
  const lista = semanas
    .filter((s) => s.empleado_id === empleadoId)
    .sort((a, b) => b.semana_inicio.localeCompare(a.semana_inicio))
    .slice(0, limite)
    .map((s): SemanaPago => {
      const copia: Partial<typeof s> = { ...s };
      delete copia.empleado_id;
      return copia as SemanaPago;
    });
  return delay(lista);
}

export async function marcarSemanaPagada(params: {
  id: string;
  fecha_pago?: string;
  notas?: string;
}): Promise<boolean> {
  const s = semanas.find((x) => x.id === params.id) ?? fail("Semana no encontrada");
  s.pagado = true;
  s.fecha_pago = params.fecha_pago || fechaLocal(new Date());
  s.notas = params.notas || null;
  return delay(true);
}

export async function vincularUsuarioEmpleado(
  empleadoId: string,
  usuarioId: string | null,
): Promise<boolean> {
  const emp = buscarEmpleado(empleadoId);
  if (usuarioId) {
    const otro = empleados.find((e) => e.usuario_id === usuarioId && e.id !== empleadoId);
    if (otro) otro.usuario_id = null;
  }
  emp.usuario_id = usuarioId;
  return delay(true);
}
