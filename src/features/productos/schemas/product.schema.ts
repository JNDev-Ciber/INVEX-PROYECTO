import { z } from "zod";

/**
 * Schema para el formulario de producto.
 *
 * - `existingCodes`: lista de códigos ya existentes en el inventario.
 *   Si `isEditing` es `false`, se valida que el `code` ingresado no esté
 *   en esa lista. En modo edición se permite cualquier código (incluido
 *   el original del producto que se edita).
 */
export function productSchema(
  existingCodes: string[] = [],
  isEditing: boolean = false,
) {
  return z.object({
    id: z.string().optional(),

    code: z
      .string({ required_error: "El código es requerido" })
      .min(1, "El código es requerido")
      .refine((v) => v === v.trim(), {
        message: "El código no puede tener espacios al inicio o al final",
      })
      .refine(
        (v) => {
          if (isEditing) return true;
          return !existingCodes.includes(v);
        },
        { message: "Este código ya existe" },
      ),

    name: z
      .string({ required_error: "El nombre es requerido" })
      .min(2, "El nombre debe tener al menos 2 caracteres"),

    description: z.string().optional().default(""),

    category: z
      .string({ required_error: "La categoría es requerida" })
      .min(1, "La categoría es requerida"),

    subcategory: z.string().optional().default(""),

    // El precio y el costo se guardan como enteros (pesos). Se redondea
    // por si el usuario cargó centavos ("1500,50").
    price: z.coerce
      .number({ invalid_type_error: "Precio inválido" })
      .positive("El precio debe ser mayor a 0")
      .transform((v) => Math.round(v)),

    cost: z.coerce
      .number({ invalid_type_error: "Costo inválido" })
      .min(0, "El costo no puede ser negativo")
      .transform((v) => Math.round(v)),

    // En edición el stock no se toca desde este form (se corrige por
    // "Agregar Stock", que sí queda registrado en movimientos), por eso
    // acá queda opcional; en alta sigue siendo obligatorio.
    quantity: isEditing
      ? z.coerce.number().optional().default(0)
      : z.coerce
          .number({ invalid_type_error: "Cantidad inválida" })
          .int("La cantidad debe ser un número entero")
          .min(0, "La cantidad no puede ser negativa"),

    minStock: z.coerce
      .number({ invalid_type_error: "Stock mínimo inválido" })
      .int("El stock mínimo debe ser un número entero")
      .min(0, "El stock mínimo no puede ser negativo"),

    imageUrl: z.string().optional().default(""),

    barcode: z
      .string()
      .optional()
      .default("")
      .refine((v) => !v || /^\d{0,128}$/.test(v), {
        message: "El código de barras solo puede contener dígitos",
      }),
  });
}

/**
 * Tipo inferido a partir del schema. El segundo parámetro siempre se
 * resuelve igual a nivel de tipos (la lógica de `existingCodes` solo
 * impacta en runtime), así que tomamos cualquier instancia para inferir.
 */
export type ProductFormValues = z.infer<ReturnType<typeof productSchema>>;
