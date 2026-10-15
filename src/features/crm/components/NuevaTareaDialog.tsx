import { useMemo, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import type { ClienteCrm, TipoSeguimiento } from "@/mocks/crm";
import { useAgregarSeguimiento } from "../hooks/use-crm";
import { TIPOS_SEGUIMIENTO, hoyISO } from "../lib/crm-format";

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function mensajeError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : "";
  return msg.replace(/\s*\(code=.*\)$/, "") || fallback;
}

export interface AgendarState {
  open: boolean;
  /** Cliente ya elegido (desde una lista); si falta, se muestra el buscador. */
  cliente?: { id: number; nombre: string };
  /** Texto sugerido para la tarea. */
  texto?: string;
}

/**
 * Crea una tarea/llamada agendada para un cliente. Se usa desde la Agenda
 * ("+ Agendar") y desde "Para contactar hoy" (con el cliente ya elegido).
 *
 * El formulario se monta fresco en cada apertura (solo se renderiza cuando
 * `state.open`), así siempre arranca con los valores de esta apertura y no
 * quedan datos de una anterior.
 */
export function NuevaTareaDialog({
  clientes,
  state,
  onOpenChange,
}: {
  clientes: ClienteCrm[];
  state: AgendarState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {state.open && (
          <FormularioTarea
            clientes={clientes}
            clienteFijo={state.cliente}
            textoInicial={state.texto ?? ""}
            onListo={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioTarea({
  clientes,
  clienteFijo,
  textoInicial,
  onListo,
}: {
  clientes: ClienteCrm[];
  clienteFijo?: { id: number; nombre: string };
  textoInicial: string;
  onListo: () => void;
}) {
  const { toast } = useToast();
  const agregar = useAgregarSeguimiento();

  const [clienteId, setClienteId] = useState<number | null>(clienteFijo?.id ?? null);
  const [tipo, setTipo] = useState<TipoSeguimiento>("llamada");
  const [fecha, setFecha] = useState(hoyISO());
  const [texto, setTexto] = useState(textoInicial);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda);
    const base = q
      ? clientes.filter((c) => normalizar(c.nombre).includes(q) || (c.telefono ?? "").includes(busqueda))
      : clientes;
    return [...base].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).slice(0, 50);
  }, [clientes, busqueda]);

  const hoy = hoyISO();
  const faltaFecha = tipo === "tarea" && !fecha;
  const puedeGuardar = !!clienteId && !!texto.trim() && !faltaFecha && !agregar.isPending;

  const guardar = async () => {
    if (!clienteId || !texto.trim()) return;
    try {
      await agregar.mutateAsync({ clienteId, tipo, texto, fechaProgramada: fecha || null });
      toast({ title: "Tarea agendada" });
      onListo();
    } catch (err) {
      toast({ title: mensajeError(err, "No se pudo agendar"), variant: "destructive" });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agendar contacto</DialogTitle>
        <DialogDescription>
          Programá una llamada, visita o tarea con fecha. Queda en la agenda hasta que la marques
          hecha.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {/* Cliente: fijo si vino elegido; buscador si no. */}
        {clienteFijo ? (
          <div className="rounded-md border bg-muted/40 p-2.5 text-sm">
            <span className="text-muted-foreground">Cliente: </span>
            <span className="font-medium">{clienteFijo.nombre}</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar cliente por nombre o teléfono"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <ul className="max-h-40 divide-y overflow-y-auto rounded-md border">
              {filtrados.length === 0 ? (
                <li className="p-3 text-center text-xs text-muted-foreground">Sin resultados.</li>
              ) : (
                filtrados.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setClienteId(c.id)}
                      className={`flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm hover:bg-muted/50 ${
                        clienteId === c.id ? "bg-muted/60" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.nombre}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.telefono || "Sin teléfono"}
                        </span>
                      </span>
                      {clienteId === c.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoSeguimiento)}>
            <SelectTrigger aria-label="Tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIPOS_SEGUIMIENTO).map(([valor, label]) => (
                <SelectItem key={valor} value={valor}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            aria-label="Para cuándo"
            value={fecha}
            min={hoy}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <Textarea
          placeholder="Qué hay que hacer (ej: llamarlo para ofrecerle la heladera nueva)"
          value={texto}
          maxLength={1000}
          rows={3}
          onChange={(e) => setTexto(e.target.value)}
        />
        {faltaFecha && (
          <p className="text-xs text-red-600 dark:text-red-400">La tarea necesita una fecha.</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onListo} disabled={agregar.isPending}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={!puedeGuardar}>
          {agregar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Agendar
        </Button>
      </DialogFooter>
    </>
  );
}
