

import type { Control, UseFormSetValue } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User, Search } from "lucide-react";
import type { ClienteVenta } from "@/shared/types/inventory";
import type { FacturaVentaFormValues } from "../../schemas/factura-venta.schema";

interface Props {
  control: Control<FacturaVentaFormValues>;
  setValue: UseFormSetValue<FacturaVentaFormValues>;
  searchClienteTerm: string;
  setSearchClienteTerm: React.Dispatch<React.SetStateAction<string>>;
  showClienteDropdown: boolean;
  setShowClienteDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  filteredClientes: ClienteVenta[];
}

export function DatosClienteCard({
  control,
  setValue,
  searchClienteTerm,
  setSearchClienteTerm,
  showClienteDropdown,
  setShowClienteDropdown,
  filteredClientes,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <User className="h-5 w-5" />
          Datos del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ⬅️ COMBOBOX DE CLIENTES - BIEN POSICIONADO */}
        <div>
          <Label htmlFor="clienteSelect">Seleccionar Cliente</Label>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="clienteSelect"
                placeholder="Buscar cliente..."
                value={searchClienteTerm}
                onChange={(e) => setSearchClienteTerm(e.target.value)}
                onClick={() => setShowClienteDropdown(true)}
                onFocus={() => setShowClienteDropdown(true)}
                className="pl-10 cursor-pointer"
              />
            </div>

            {/* Dropdown - aparece DEBAJO */}
            {showClienteDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {filteredClientes.length > 0 ? (
                  filteredClientes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setValue("clienteNombre", c.nombre, {
                          shouldValidate: true,
                        });
                        setValue("clienteCuit", c.cuit || "", {
                          shouldValidate: true,
                        });
                        setValue("clienteDireccion", c.direccion || "", {
                          shouldValidate: true,
                        });
                        setValue("clienteTelefono", c.telefono || "", {
                          shouldValidate: true,
                        });
                        setValue("clienteEmail", c.email || "", {
                          shouldValidate: true,
                        });
                        setShowClienteDropdown(false);
                        setSearchClienteTerm("");
                      }}
                      className="w-full p-3 text-left hover:bg-accent border-b last:border-b-0 transition-colors flex justify-between items-start"
                    >
                      <div>
                        <p className="font-semibold text-sm">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.cuit}
                        </p>
                      </div>
                      {c.saldoPendiente > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          ${c.saldoPendiente.toLocaleString()}
                        </Badge>
                      )}
                    </button>
                  ))
                ) : searchClienteTerm ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No se encontraron clientes
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Escribe para buscar...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ⬅️ Cerrar dropdown al clickear afuera */}
        {showClienteDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowClienteDropdown(false)}
          />
        )}

        {/* ⬅️ Cerrar dropdown al clickear afuera */}
        {showClienteDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowClienteDropdown(false)}
          />
        )}

        {/* Campos de la factura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="clienteNombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre / Razón Social *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="clienteCuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CUIT/DNI</FormLabel>
                <FormControl>
                  <Input placeholder="CUIT del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="clienteDireccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="clienteTelefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Teléfono del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="clienteEmail"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Email (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@cliente.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
