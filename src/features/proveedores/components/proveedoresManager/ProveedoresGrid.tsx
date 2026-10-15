import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Trash2, Phone } from "lucide-react";
import type { Proveedor } from "@/shared/types/inventory";

type FilterDeuda = "todos" | "saldo" | "pagado";

interface ProveedoresGridProps {
  proveedores: Proveedor[];
  filteredProveedores: Proveedor[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterDeuda: FilterDeuda;
  setFilterDeuda: (f: FilterDeuda) => void;
  onSelectProveedor: (p: Proveedor) => void;
  onDeleteProveedor: (p: Proveedor, e?: React.MouseEvent) => void;
}

export function ProveedoresGrid({
  proveedores,
  filteredProveedores,
  searchTerm,
  setSearchTerm,
  filterDeuda,
  setFilterDeuda,
  onSelectProveedor,
  onDeleteProveedor,
}: ProveedoresGridProps) {
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
              {f === "todos" && `Todos (${proveedores.length})`}
              {f === "saldo" &&
                `Deben (${proveedores.filter((p) => p.saldoPendiente > 0).length})`}
              {f === "pagado" &&
                `Al día (${proveedores.filter((p) => p.saldoPendiente === 0).length})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProveedores.length === 0 ? (
          <p className="text-muted-foreground">No hay proveedores</p>
        ) : (
          filteredProveedores.map((p) => (
            <Card
              key={p.id}
              className={`p-4 cursor-pointer relative transition-all hover:shadow-lg ${
                p.saldoPendiente > 0
                  ? "border-l-4 border-l-orange-500 bg-orange-50/30"
                  : "border-l-4 border-l-green-500"
              }`}
              onClick={() => onSelectProveedor(p)}
            >
              <button
                onClick={(e) => onDeleteProveedor(p, e)}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>

              <div className="pr-8">
                <h4 className="font-bold text-lg">{p.nombre}</h4>
                {p.cuit && <p className="text-sm text-muted-foreground">{p.cuit}</p>}
                {p.telefono && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {p.telefono}
                  </p>
                )}
                {p.saldoPendiente > 0 && (
                  <p className="text-lg font-bold text-orange-600 mt-2">
                    ${p.saldoPendiente.toLocaleString()}
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
