import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import {
  nuevoProveedorSchema,
  type NuevoProveedorValues,
} from "@/features/proveedores/schemas/proveedor.schema";

interface NuevoProveedorFormProps {
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: NuevoProveedorValues) => Promise<void> | void;
}

export function NuevoProveedorForm({ isLoading, onClose, onSave }: NuevoProveedorFormProps) {
  const form = useForm<NuevoProveedorValues>({
    resolver: zodResolver(nuevoProveedorSchema),
    defaultValues: { nombre: "", cuit: "", telefono: "", email: "", direccion: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSave(values);
    form.reset();
  });

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <div className="p-4 sm:p-5 border-b border-orange-200/60">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">Nuevo proveedor</div>
            <div className="text-sm text-muted-foreground">Solo el nombre es obligatorio</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 w-9 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del proveedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT</FormLabel>
                  <FormControl>
                    <Input placeholder="20-12345678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@proveedor.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              Guardar
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
