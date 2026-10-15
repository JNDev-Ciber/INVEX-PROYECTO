
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, DollarSign } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { MarginAnalysis } from "./MarginAnalysis";
import type { ProductFormValues } from "@/features/productos/schemas/product.schema";

interface PricingSectionProps {
  isDark: boolean;
  margin: number;
}

// Interpreta el monto en formato argentino: el punto es separador de miles
// y la coma es el decimal. Así "2.500" es 2500 (antes se leía 2,5) y
// "1500,50" es 1500.5 (antes pasaba a 150050).
const limpiarMonto = (value: string) => {
  if (value === "") return "";
  let v = value.replace(/[^0-9.,]/g, "");
  if (v.includes(",")) {
    v = v.replace(/\./g, "").replace(",", ".");
  } else {
    v = v.replace(/\./g, "");
  }
  return v;
};

export function PricingSection({ isDark, margin }: PricingSectionProps) {
  const form = useFormContext<ProductFormValues>();
  const cost = form.watch("cost");
  const price = form.watch("price");

  // El input maneja strings; RHF lo guarda igual y zod lo coerce a número.
  // Para mostrar correctamente el valor tomamos el RAW del field.

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
        <DollarSign className="h-4 w-4" />
        Precios y Costos
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="cost"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Costo Unitario *
                {fieldState.error && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </FormLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    value={field.value === undefined || field.value === null ? "" : String(field.value)}
                    onChange={(e) =>
                      field.onChange(limpiarMonto(e.target.value))
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className={`pl-8 ${
                      fieldState.error ? "border-red-500" : ""
                    }`}
                    placeholder="0"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Precio de Venta *
                {fieldState.error && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </FormLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    value={field.value === undefined || field.value === null ? "" : String(field.value)}
                    onChange={(e) =>
                      field.onChange(limpiarMonto(e.target.value))
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className={`pl-8 ${
                      fieldState.error ? "border-red-500" : ""
                    }`}
                    placeholder="0"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Indicador de margen */}
      {price !== undefined && String(price) !== "" && cost !== undefined && String(cost) !== "" && (
        <MarginAnalysis
          isDark={isDark}
          margin={margin}
          cost={String(cost)}
          price={String(price)}
        />
      )}
    </div>
  );
}
