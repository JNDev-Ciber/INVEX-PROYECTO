import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/shared/components/layout/theme-provider";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertCircle,
  CheckCircle,
  Calculator,
  Package,
  Loader2,
  ArrowLeft,
  Save,
  RotateCcw,
  X,
} from "lucide-react";
import type { Product } from "@/shared/types/inventory";
import { ImageSection } from "./product-form/ImageSection";
import { CategoryField } from "./product-form/CategoryField";
import { SubcategoryField } from "./product-form/SubcategoryField";
import { PricingSection } from "./product-form/PricingSection";
import {
  productSchema,
  type ProductFormValues,
} from "@/features/productos/schemas/product.schema";
import { uploadImage } from "@/mocks/upload-image";

interface Producto {
  id?: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  cost: number;
  quantity: number;
  minStock: number;
  imageUrl?: string;
  barcode?: string;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface Props {
  onSubmit: (producto: Producto) => void;
  initialData?: any;
  editing?: boolean;
  existingCodes?: string[];
  isEditing?: boolean;
  productId?: string;
  onCancel?: () => void;
  products?: Product[];
  categories?: string[];
  subcategories?: Subcategory[];
}

// Tipo de entrada del form (lo que vive en RHF antes del parseo de zod).
// Con `z.coerce` los campos numéricos pueden ser strings al ingresar y zod
// los convierte a number a la salida.
type FormInput = z.input<ReturnType<typeof productSchema>>;

const buildDefaults = (data?: any): FormInput => ({
  id: data?.id ?? undefined,
  code: data?.code != null ? String(data.code) : "",
  name: data?.name != null ? String(data.name) : "",
  description: data?.description != null ? String(data.description) : "",
  category: data?.category != null ? String(data.category) : "",
  subcategory: data?.subcategory != null ? String(data.subcategory) : "",
  price:
    data?.price !== undefined && data?.price !== null && data?.price !== ""
      ? (String(data.price) as unknown as number)
      : ("" as unknown as number),
  cost:
    data?.cost !== undefined && data?.cost !== null && data?.cost !== ""
      ? (String(data.cost) as unknown as number)
      : ("" as unknown as number),
  quantity:
    data?.quantity !== undefined &&
    data?.quantity !== null &&
    data?.quantity !== ""
      ? (String(data.quantity) as unknown as number)
      : ("" as unknown as number),
  minStock:
    data?.minStock !== undefined &&
    data?.minStock !== null &&
    data?.minStock !== ""
      ? (String(data.minStock) as unknown as number)
      : ("" as unknown as number),
  imageUrl: data?.imageUrl != null ? String(data.imageUrl) : "",
  barcode: data?.barcode != null ? String(data.barcode) : "",
});

export function ProductForm({
  onSubmit,
  initialData,
  editing,
  isEditing = false,
  productId,
  onCancel,
  existingCodes,
  products = [],
  categories = [],
  subcategories = [],
}: Props) {
  const navigate = useNavigate();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Imagen
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | undefined>(undefined);
  const [, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categoría y subcategoría (UI state, no datos del form)
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Errores de submit globales
  const [formError, setFormError] = useState<string | undefined>(undefined);

  // Control de inicialización
  const initialDataProcessed = useRef(false);
  const isInitialized = useRef(false);

  // Schema dinámico que depende de existingCodes / isEditing
  const schema = useMemo(
    () => productSchema(existingCodes ?? [], !!(editing || isEditing)),
    [existingCodes, editing, isEditing],
  );

  const form = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: buildDefaults(initialData),
    mode: "onSubmit",
  });

  // Memoizar categorías existentes
  const existingCategories = useMemo(() => {
    const source =
      categories.length > 0 ? categories : products.map((p) => p.category);
    return Array.from(new Set(source)).filter(Boolean);
  }, [products, categories]);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // Reset cuando cambia initialData (solo la primera vez que llega)
  useEffect(() => {
    if (initialData && !initialDataProcessed.current) {
      const defaults = buildDefaults(initialData);
      form.reset(defaults);
      if (defaults.imageUrl) setImagePreview(String(defaults.imageUrl));
      initialDataProcessed.current = true;
      isInitialized.current = true;
    }
  }, [initialData, form]);

  // Soporte legacy de productId (mock, igual que el componente original)
  useEffect(() => {
    if (productId && !initialData && !isInitialized.current) {
      const mockProduct = {
        id: productId,
        code: "ELECTRO-" + productId,
        name: "PRODUCT " + productId,
        category: "NOTEBOOKS",
        subcategory: "GAMING",
        price: 100,
        cost: 80,
        quantity: 10,
        minStock: 5,
        description: "Product description",
      };
      form.reset(buildDefaults(mockProduct));
      isInitialized.current = true;
    }
  }, [productId, initialData, form]);

  // Watchers para márgenes y filtros — useWatch evita re-render del form root
  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const watchedSubcategory = useWatch({
    control: form.control,
    name: "subcategory",
  });
  const watchedPrice = useWatch({ control: form.control, name: "price" });
  const watchedCost = useWatch({ control: form.control, name: "cost" });

  // FILTRADO DE SUBCATEGORÍAS
  const filteredSubcategories = useMemo(() => {
    if (!watchedCategory) return [];
    return subcategories.filter((sub) => sub.categoryId === watchedCategory);
  }, [watchedCategory, subcategories]);

  // Limpieza de subcategoría inválida
  useEffect(() => {
    if (
      watchedSubcategory &&
      filteredSubcategories.length > 0 &&
      !filteredSubcategories.some((sub) => sub.name === watchedSubcategory)
    ) {
      form.setValue("subcategory", "", { shouldValidate: false });
    }
  }, [watchedSubcategory, filteredSubcategories, form]);

  // Cálculo de margen
  const margin = useMemo(() => {
    const priceN = parseFloat(String(watchedPrice ?? ""));
    const costN = parseFloat(String(watchedCost ?? ""));
    if (!isNaN(priceN) && !isNaN(costN) && priceN !== 0) {
      return ((priceN - costN) / priceN) * 100;
    }
    return 0;
  }, [watchedPrice, watchedCost]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setShowCustomInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Imagen
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("El archivo debe ser una imagen (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("La imagen no puede superar los 5MB");
      return;
    }
    setImageError(undefined);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) handleImageFile(file);
      }
    },
    [handleImageFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.type.startsWith("image/")) handleImageFile(file);
      }
    },
    [handleImageFile],
  );

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("imageUrl", "", { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [form]);

  // Categoría
  const handleCategorySelect = useCallback(
    (category: string) => {
      if (category === "__custom__") {
        setShowCustomInput(true);
        setCustomCategory("");
        setIsDropdownOpen(false);
      } else {
        form.setValue("category", category, { shouldValidate: true });
        form.setValue("subcategory", "", { shouldValidate: false });
        setIsDropdownOpen(false);
        setShowCustomInput(false);
      }
    },
    [form],
  );

  const handleCustomCategorySubmit = useCallback(() => {
    if (customCategory.trim()) {
      form.setValue("category", customCategory.trim().toUpperCase(), {
        shouldValidate: true,
      });
      form.setValue("subcategory", "", { shouldValidate: false });
      setShowCustomInput(false);
      setCustomCategory("");
    }
  }, [customCategory, form]);

  const handleSubcategorySelect = useCallback(
    (subcategory: string) => {
      if (subcategory === "__custom__") {
        setShowCustomSubcategory(true);
        setCustomSubcategory("");
      } else {
        form.setValue("subcategory", subcategory, { shouldValidate: true });
        setShowCustomSubcategory(false);
      }
    },
    [form],
  );

  const handleCustomSubcategorySubmit = useCallback(() => {
    if (customSubcategory.trim()) {
      form.setValue("subcategory", customSubcategory.trim().toUpperCase(), {
        shouldValidate: true,
      });
      setShowCustomSubcategory(false);
      setCustomSubcategory("");
    }
  }, [customSubcategory, form]);

  // Generador de código
  const generateProductCode = useCallback(() => {
    const currentCategory = form.getValues("category");
    const generateUniqueCode = () => {
      const categoryPrefix = currentCategory
        ? String(currentCategory).substring(0, 7).toUpperCase()
        : "ELECTRO";
      const now = Date.now();
      const timestamp = now.toString().slice(-8);
      const randomSuffix = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      const performanceCounter = Math.floor(performance.now() * 1000) % 10000;
      const counterSuffix = performanceCounter.toString().padStart(4, "0");
      return `${categoryPrefix}-${timestamp}-${randomSuffix}-${counterSuffix}`;
    };
    let newCode = generateUniqueCode();
    let attempts = 0;
    const maxAttempts = 100;
    while (
      existingCodes &&
      existingCodes.includes(newCode) &&
      attempts < maxAttempts
    ) {
      attempts++;
      newCode = generateUniqueCode();
    }
    if (attempts >= maxAttempts) {
      const categoryPrefix = currentCategory
        ? String(currentCategory).substring(0, 7).toUpperCase()
        : "ELECTRO";
      const uuid = crypto
        .randomUUID()
        .replace(/-/g, "")
        .substring(0, 12)
        .toUpperCase();
      newCode = `${categoryPrefix}-${uuid}`;
    }
    form.setValue("code", newCode, { shouldValidate: true });
  }, [form, existingCodes]);

  // Helpers numéricos para cantidad/stock (solo enteros)
  const cleanInteger = (value: string) => value.replace(/[^0-9]/g, "");

  // Submit
  const handleFormSubmit = form.handleSubmit(async (data) => {
    setFormError(undefined);
    setUploading(true);

    try {
      let imageUrl = data.imageUrl as unknown as string;

      if (imageFile) {
        try {
          const { secure_url } = await uploadImage(imageFile);
          imageUrl = secure_url;
        } catch (error) {
          setImageError(
            error instanceof Error
              ? error.message
              : "Error al subir la imagen. Intente nuevamente.",
          );
          return;
        }
      }

      const cleanedBarcode = String((data as any).barcode || "")
        .trim()
        .replace(/\s+/g, "");
      const normalizedBarcode =
        cleanedBarcode && cleanedBarcode !== "0" ? cleanedBarcode : undefined;

      const productData: Producto = {
        id: (data as any).id || undefined,
        code: data.code as unknown as string,
        name: data.name as unknown as string,
        description: ((data as any).description ?? "") as string,
        category: data.category as unknown as string,
        subcategory: ((data as any).subcategory || undefined) as
          | string
          | undefined,
        price: Number(data.price) || 0,
        cost: Number(data.cost) || 0,
        quantity: parseInt(String(data.quantity)) || 0,
        minStock: parseInt(String(data.minStock)) || 0,
        imageUrl: imageUrl || undefined,
        barcode: normalizedBarcode,
      };

      await onSubmit(productData);
    } catch (error) {
      console.error("Error al enviar formulario:", error);
      setFormError("Ocurrió un error al guardar el producto");
    } finally {
      setUploading(false);
    }
  });

  const handleClear = useCallback(() => {
    form.reset(buildDefaults(undefined));
    setFormError(undefined);
    setImageError(undefined);
    setShowCustomInput(false);
    setShowCustomSubcategory(false);
    setIsDropdownOpen(false);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    isInitialized.current = false;
    initialDataProcessed.current = false;
  }, [form]);

  const handleCancel = useCallback(() => {
    handleClear();
    if (onCancel) {
      onCancel();
    } else if (navigate) {
      navigate("/");
    }
  }, [handleClear, onCancel, navigate]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="w-full max-w-6xl mx-auto p-1 sm:p-2">
      <Card className="shadow-lg">
        {watchedPrice !== undefined &&
          String(watchedPrice) !== "" &&
          watchedCost !== undefined &&
          String(watchedCost) !== "" && (
            <CardHeader className="bg-muted/40 border-b p-3 sm:p-4">
              <div className="flex justify-end">
                <Badge
                  variant={margin > 0 ? "default" : "destructive"}
                  className="text-sm px-3 py-1"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  Margen: {margin.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
          )}

        <CardContent className="p-3 sm:p-4">
          <Form {...form}>
            <form
              onSubmit={handleFormSubmit}
              className="space-y-3 sm:space-y-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Columna izquierda: imagen */}
                <ImageSection
                  isDark={isDark}
                  dragActive={dragActive}
                  imagePreview={imagePreview}
                  fileInputRef={fileInputRef}
                  imageError={imageError}
                  handleDrag={handleDrag}
                  handleDrop={handleDrop}
                  handleFileSelect={handleFileSelect}
                  removeImage={removeImage}
                />

                {/* Columna derecha: formulario */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Información básica */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      <Package className="h-4 w-4" />
                      Información Básica
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Código del Producto *
                              {fieldState.error && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              {field.value && !fieldState.error && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  className={`flex-1 ${
                                    fieldState.error ? "border-red-500" : ""
                                  }`}
                                  placeholder="Ej: ELECTRO-001"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                onClick={generateProductCode}
                                variant="outline"
                                size="sm"
                                className="px-3 whitespace-nowrap"
                                disabled={isSubmitting}
                              >
                                AUTO
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Nombre del Producto *
                              {fieldState.error && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              {field.value && !fieldState.error && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                className={
                                  fieldState.error ? "border-red-500" : ""
                                }
                                placeholder="Ej: LAPTOP HP PAVILION"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Código de Barras */}
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Barras</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Ej: 7798123456789"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Categoría */}
                      <CategoryField
                        isDark={isDark}
                        existingCategories={existingCategories}
                        showCustomInput={showCustomInput}
                        setShowCustomInput={setShowCustomInput}
                        isDropdownOpen={isDropdownOpen}
                        setIsDropdownOpen={setIsDropdownOpen}
                        customCategory={customCategory}
                        setCustomCategory={setCustomCategory}
                        dropdownRef={dropdownRef}
                        handleCategorySelect={handleCategorySelect}
                        handleCustomCategorySubmit={handleCustomCategorySubmit}
                      />

                      {/* Subcategoría */}
                      <SubcategoryField
                        isDark={isDark}
                        category={String(watchedCategory ?? "")}
                        filteredSubcategories={filteredSubcategories}
                        showCustomSubcategory={showCustomSubcategory}
                        setShowCustomSubcategory={setShowCustomSubcategory}
                        customSubcategory={customSubcategory}
                        setCustomSubcategory={setCustomSubcategory}
                        handleSubcategorySelect={handleSubcategorySelect}
                        handleCustomSubcategorySubmit={
                          handleCustomSubcategorySubmit
                        }
                      />
                    </div>
                  </div>

                  {/* Precios y costos */}
                  <PricingSection isDark={isDark} margin={margin} />

                  {/* Stock e inventario */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      <Package className="h-4 w-4" />
                      Stock e Inventario
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!(editing || isEditing) && (
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Cantidad Inicial *
                                {fieldState.error && (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  id="quantity"
                                  inputMode="numeric"
                                  value={
                                    field.value === undefined ||
                                    field.value === null
                                      ? ""
                                      : String(field.value)
                                  }
                                  onChange={(e) =>
                                    field.onChange(cleanInteger(e.target.value))
                                  }
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className={
                                    fieldState.error ? "border-red-500" : ""
                                  }
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {(editing || isEditing) && (
                        <p className="text-sm text-muted-foreground self-end pb-2">
                          El stock actual se corrige desde "Agregar Stock", no
                          desde acá.
                        </p>
                      )}

                      <FormField
                        control={form.control}
                        name="minStock"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Stock Mínimo *
                              {fieldState.error && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                inputMode="numeric"
                                value={
                                  field.value === undefined ||
                                  field.value === null
                                    ? ""
                                    : String(field.value)
                                }
                                onChange={(e) =>
                                  field.onChange(cleanInteger(e.target.value))
                                }
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                className={
                                  fieldState.error ? "border-red-500" : ""
                                }
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción del Producto</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            rows={3}
                            placeholder="Describe las características principales del producto..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Error global de submit */}
              {formError && (
                <p className="text-sm font-medium text-destructive">
                  {formError}
                </p>
              )}

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none sm:min-w-[200px] bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editing || isEditing
                        ? "Actualizando..."
                        : "Guardando..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editing || isEditing
                        ? "Actualizar Producto"
                        : "Guardar Producto"}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>

                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}

                {navigate && (editing || isEditing) && !onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/")}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {isMobile ? "Volver" : "Volver a la lista"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
