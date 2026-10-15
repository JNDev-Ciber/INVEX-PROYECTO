import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSucursalStore } from "@/app/stores";
import { useSucursalActiva } from "@/features/sucursales/hooks/use-sucursales";

/**
 * Sucursal activa en el header. El admin la puede cambiar; el resto solo
 * ve en cuál está trabajando.
 *
 * Además publica la sucursal en el store para que los servicios la manden
 * en cada RPC, y al cambiarla recarga todos los datos.
 */
export function SucursalSelector() {
  const { sucursal, sucursalId, sucursales, puedeCambiar, setSucursal } = useSucursalActiva();
  const setSucursalOperacionId = useSucursalStore((s) => s.setSucursalOperacionId);
  const queryClient = useQueryClient();
  const anterior = useRef<string | null>(null);

  useEffect(() => {
    setSucursalOperacionId(sucursalId);
    // También la primera vez: lo que se cargó antes de conocer la sucursal
    // vino con el stock total.
    if (sucursalId && anterior.current !== sucursalId) {
      queryClient.invalidateQueries();
    }
    anterior.current = sucursalId;
  }, [sucursalId, setSucursalOperacionId, queryClient]);

  if (!sucursal) return null;

  if (!puedeCambiar) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
        <Store className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[120px] sm:max-w-[180px]">{sucursal.nombre}</span>
      </span>
    );
  }

  return (
    <Select value={sucursal.id} onValueChange={setSucursal}>
      <SelectTrigger
        className="h-8 w-auto max-w-[160px] sm:max-w-[220px] gap-1.5 text-xs"
        aria-label="Sucursal activa"
      >
        <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sucursales.map((s) => (
          <SelectItem key={s.id} value={s.id} className="text-xs">
            {s.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
