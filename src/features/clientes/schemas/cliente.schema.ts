import { z } from "zod";

export const nuevoClienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  cuit: z
    .string()
    .trim()
    .regex(
      /^(\d{2}-?\d{8}-?\d{1})?$/,
      "CUIT inválido (formato: 20-12345678-9)"
    )
    .optional()
    .or(z.literal("")),
  telefono: z
    .string()
    .trim()
    .max(30, "Teléfono demasiado largo")
    .regex(/^[\d\s()+-]*$/, "El teléfono solo puede tener números y + ( ) -")
    .optional()
    .or(z.literal("")),
});

export type NuevoClienteValues = z.infer<typeof nuevoClienteSchema>;

export const pagoParcialSchema = z.object({
  monto: z.coerce
    .number({ invalid_type_error: "El monto debe ser un número" })
    .positive("El monto debe ser mayor a 0"),
});

export type PagoParcialValues = z.infer<typeof pagoParcialSchema>;

export const deudaManualSchema = z.object({
  monto: z.coerce
    .number({ invalid_type_error: "El monto debe ser un número" })
    .positive("El monto debe ser mayor a 0"),
  concepto: z.string().trim().min(1, "Concepto obligatorio"),
});

export type DeudaManualValues = z.infer<typeof deudaManualSchema>;
