
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle, Check } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { Dispatch, SetStateAction } from "react";
import type { ProductFormValues } from "@/features/productos/schemas/product.schema";

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface SubcategoryFieldProps {
  isDark: boolean;
  category: string;
  filteredSubcategories: Subcategory[];
  showCustomSubcategory: boolean;
  setShowCustomSubcategory: Dispatch<SetStateAction<boolean>>;
  customSubcategory: string;
  setCustomSubcategory: Dispatch<SetStateAction<string>>;
  handleSubcategorySelect: (subcategory: string) => void;
  handleCustomSubcategorySubmit: () => void;
}

export function SubcategoryField({
  category,
  filteredSubcategories,
  showCustomSubcategory,
  setShowCustomSubcategory,
  customSubcategory,
  setCustomSubcategory,
  handleSubcategorySelect,
  handleCustomSubcategorySubmit,
}: SubcategoryFieldProps) {
  const form = useFormContext<ProductFormValues>();

  return (
    <FormField
      control={form.control}
      name="subcategory"
      render={({ field }) => {
        const subcategory = field.value ?? "";

        return (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Subcategoría
              {subcategory && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
            </FormLabel>

            {category && (
              <>
                {filteredSubcategories.length > 0 && !showCustomSubcategory ? (
                  <div className="space-y-2">
                    <select
                      value={subcategory}
                      onChange={(e) => handleSubcategorySelect(e.target.value)}
                      className={`
                                  w-full px-3 py-2 border rounded-md shadow-sm bg-background
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                                  border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200
                                `}
                    >
                      <option value="">Seleccionar subcategoría...</option>
                      {filteredSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                      <option value="__custom__">
                        + Crear nueva subcategoría
                      </option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {showCustomSubcategory ? (
                      <div className="flex gap-2">
                        <Input
                          value={customSubcategory}
                          onChange={(e) =>
                            setCustomSubcategory(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCustomSubcategorySubmit();
                            }
                            if (e.key === "Escape") {
                              setShowCustomSubcategory(false);
                              setCustomSubcategory("");
                            }
                          }}
                          placeholder="Escribir nueva subcategoría..."
                          className="border-blue-500"
                          autoFocus
                        />
                        <Button
                          type="button"
                          onClick={handleCustomSubcategorySubmit}
                          size="sm"
                          className="px-3"
                          disabled={!customSubcategory.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <FormControl>
                        <Input
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          placeholder="Ej: GAMING, ULTRABOOK, BÁSICO..."
                        />
                      </FormControl>
                    )}

                    {filteredSubcategories.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomSubcategory(false)}
                        className="text-xs flex items-center gap-1"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Ver subcategorías existentes
                      </Button>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Las subcategorías ayudan a organizar mejor tus productos
                </p>
              </>
            )}

            {!category && (
              <p className="text-xs text-muted-foreground">
                Selecciona una categoría primero
              </p>
            )}

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
