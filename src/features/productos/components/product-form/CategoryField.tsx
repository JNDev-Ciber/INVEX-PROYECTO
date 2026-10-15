
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
import {
  AlertCircle,
  CheckCircle,
  Package,
  Plus,
  ChevronDown,
  Check,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { RefObject, Dispatch, SetStateAction } from "react";
import type { ProductFormValues } from "@/features/productos/schemas/product.schema";

interface CategoryFieldProps {
  isDark: boolean;
  existingCategories: string[];
  showCustomInput: boolean;
  setShowCustomInput: Dispatch<SetStateAction<boolean>>;
  isDropdownOpen: boolean;
  setIsDropdownOpen: Dispatch<SetStateAction<boolean>>;
  customCategory: string;
  setCustomCategory: Dispatch<SetStateAction<string>>;
  dropdownRef: RefObject<HTMLDivElement>;
  handleCategorySelect: (category: string) => void;
  handleCustomCategorySubmit: () => void;
}

export function CategoryField({
  existingCategories,
  showCustomInput,
  setShowCustomInput,
  isDropdownOpen,
  setIsDropdownOpen,
  customCategory,
  setCustomCategory,
  dropdownRef,
  handleCategorySelect,
  handleCustomCategorySubmit,
}: CategoryFieldProps) {
  const form = useFormContext<ProductFormValues>();

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message;
        const category = field.value;

        return (
          <FormItem ref={dropdownRef}>
            <FormLabel className="flex items-center gap-2">
              Categoría *
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
              {category && !error && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
            </FormLabel>

            {existingCategories.length > 0 && !showCustomInput ? (
              <div className="space-y-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`
                                w-full flex items-center justify-between px-3 py-2 text-left
                                border rounded-md shadow-sm bg-background
                                hover:bg-accent hover:text-accent-foreground
                                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                                transition-colors duration-200
                                ${
                                  error
                                    ? "border-red-500"
                                    : "border-input"
                                }
                                text-gray-900 dark:text-gray-200
                              `}
                  >
                    <span
                      className={
                        category ? "" : "text-muted-foreground"
                      }
                    >
                      {category || "Seleccionar categoría..."}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div
                      className={`
                              absolute z-50 w-full mt-1 rounded-md shadow-lg
                              max-h-60 overflow-auto
                              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
                            `}
                    >
                      {existingCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategorySelect(cat)}
                          className={`
                                      w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground
                                      flex items-center gap-2 transition-colors duration-150
                                      ${
                                        category === cat
                                          ? "bg-accent text-accent-foreground"
                                          : ""
                                      }
                                    `}
                        >
                          <Package className="h-4 w-4 text-gray-500" />
                          {cat}
                          {category === cat && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </button>
                      ))}

                      <div className="px-2 py-1">
                        <div className="border-t border-gray-200 dark:border-gray-600"></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCategorySelect("__custom__")}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 font-medium text-blue-600 transition-colors duration-150"
                      >
                        <Plus className="h-4 w-4" />
                        Crear nueva categoría
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {showCustomInput ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={customCategory}
                        onChange={(e) =>
                          setCustomCategory(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCustomCategorySubmit();
                          }
                          if (e.key === "Escape") {
                            setShowCustomInput(false);
                            setCustomCategory("");
                          }
                        }}
                        placeholder="Escribir nueva categoría..."
                        className={
                          error ? "border-red-500" : "border-blue-500"
                        }
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={handleCustomCategorySubmit}
                        size="sm"
                        className="px-3"
                        disabled={!customCategory.trim()}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                    {existingCategories.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomCategory("");
                        }}
                        className="text-xs flex items-center gap-1"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Volver a categorías existentes
                      </Button>
                    )}
                  </div>
                ) : (
                  <FormControl>
                    <Input
                      id="category"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className={error ? "border-red-500" : ""}
                      placeholder="Ej: NOTEBOOKS, CELULARES, ACCESORIOS..."
                    />
                  </FormControl>
                )}
              </div>
            )}

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
