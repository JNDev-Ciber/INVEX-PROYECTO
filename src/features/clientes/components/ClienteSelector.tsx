import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, UserPlus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useClientes } from "@/features/clientes/hooks/use-clientes";
import type { ClienteVenta } from "@/shared/types/inventory";

/**
 * Elegir el cliente de una venta (opcional). Con el cliente elegido, la
 * compra aparece en su ficha del CRM. Permite dar de alta uno nuevo con
 * nombre y teléfono sin salir de la venta.
 */
export function ClienteSelector({
  value,
  onChange,
  disabled,
  className,
}: {
  value: ClienteVenta | null;
  onChange: (cliente: ClienteVenta | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const { clientesVentas, addCliente } = useClientes();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cerrar = () => {
    setAbierto(false);
    setCreando(false);
    setBusqueda("");
  };

  const crear = async () => {
    if (!nuevoNombre.trim()) return;
    setGuardando(true);
    try {
      const creado = (await addCliente(nuevoNombre.trim(), "", nuevoTelefono.trim())) as any;
      onChange({
        id: Number(creado.id),
        nombre: String(creado.nombre),
        telefono: creado.telefono ?? undefined,
        cuit: creado.cuit ?? undefined,
        saldoPendiente: 0,
      });
      setNuevoNombre("");
      setNuevoTelefono("");
      cerrar();
    } catch (err) {
      toast({
        title: "No se pudo crear el cliente",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Popover open={abierto} onOpenChange={(o) => (o ? setAbierto(true) : cerrar())}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={abierto}
            disabled={disabled}
            className="flex-1 justify-between font-normal min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={`truncate ${value ? "" : "text-muted-foreground"}`}>
                {value ? value.nombre : "Cliente (opcional)"}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
          {creando ? (
            <div className="space-y-2 p-3">
              <p className="text-sm font-medium">Nuevo cliente</p>
              <Input
                autoFocus
                placeholder="Nombre"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crear()}
              />
              <Input
                placeholder="Teléfono (opcional)"
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crear()}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setCreando(false)}>
                  Volver
                </Button>
                <Button type="button" size="sm" onClick={crear} disabled={guardando || !nuevoNombre.trim()}>
                  {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput
                placeholder="Buscar por nombre, teléfono o CUIT"
                value={busqueda}
                onValueChange={setBusqueda}
              />
              <CommandList>
                <CommandEmpty>No hay clientes con ese dato.</CommandEmpty>
                <CommandGroup>
                  {clientesVentas.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.nombre} ${c.telefono ?? ""} ${c.cuit ?? ""} #${c.id}`}
                      onSelect={() => {
                        onChange(c);
                        cerrar();
                      }}
                    >
                      <Check className={`mr-2 h-4 w-4 ${value?.id === c.id ? "opacity-100" : "opacity-0"}`} />
                      <span className="truncate">{c.nombre}</span>
                      {c.telefono && (
                        <span className="ml-auto pl-2 text-xs text-muted-foreground shrink-0">{c.telefono}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setNuevoNombre(busqueda);
                    setCreando(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo cliente{busqueda.trim() ? `: ${busqueda.trim()}` : ""}
                </Button>
              </div>
            </Command>
          )}
        </PopoverContent>
      </Popover>
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          title="Sin cliente"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
