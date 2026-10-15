

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Search, Trash2, Phone } from "lucide-react";
import type { ClienteVenta } from "@/shared/types/inventory";

type FilterDeuda = "todos" | "saldo" | "pagado";

interface ClientesGridProps {
  clientes: ClienteVenta[];
  filteredClientes: ClienteVenta[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterDeuda: FilterDeuda;
  setFilterDeuda: (f: FilterDeuda) => void;
  onSelectCliente: (c: ClienteVenta) => void;
  onDeleteCliente: (c: ClienteVenta) => void;
}

export function ClientesGrid({
  clientes,
  filteredClientes,
  searchTerm,
  setSearchTerm,
  filterDeuda,
  setFilterDeuda,
  onSelectCliente,
  onDeleteCliente,
}: ClientesGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "saldo", "pagado"] as const).map((f) => (
            <Button
              key={f}
              variant={filterDeuda === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterDeuda(f)}
              className="flex-1"
            >
              {f === "todos" && `Todos (${clientes.length})`}
              {f === "saldo" &&
                `Deben (${clientes.filter((c) => c.saldoPendiente > 0).length})`}
              {f === "pagado" &&
                `Al día (${clientes.filter((c) => c.saldoPendiente === 0).length})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.length === 0 ? (
          <p className="text-muted-foreground">No hay clientes</p>
        ) : (
          filteredClientes.map((c) => (
            <Card
              key={c.id}
              className={`p-4 cursor-pointer relative transition-all hover:shadow-lg border-l-4 ${
                c.saldoPendiente > 0
                  ? "border-l-destructive bg-destructive/5"
                  : "border-l-[hsl(var(--income))]"
              }`}
              onClick={() => onSelectCliente(c)}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar a {c.nombre}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {c.saldoPendiente > 0
                        ? `Este cliente tiene una deuda de $${c.saldoPendiente.toLocaleString()}. `
                        : ""}
                      Esta acción no se puede deshacer. Se eliminarán todos los
                      datos asociados al cliente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => onDeleteCliente(c)}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="pr-8">
                <h4 className="font-bold text-lg">{c.nombre}</h4>
                <p className="text-sm text-muted-foreground">{c.cuit}</p>
                {c.telefono && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {c.telefono}
                  </p>
                )}

                {c.saldoPendiente > 0 && (
                  <p className="text-lg font-bold text-destructive mt-2">
                    ${c.saldoPendiente.toLocaleString()}
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
