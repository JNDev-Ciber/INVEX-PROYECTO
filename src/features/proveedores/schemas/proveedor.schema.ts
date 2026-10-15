import { z } from "zod";

export const nuevoProveedorSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  cuit: z
    .string()
    .trim()
    .regex(/^(\d{2}-?\d{8}-?\d{1})?$/, "CUIT inválido (formato: 20-12345678-9)")
    .optional()
    .or(z.literal("")),
  telefono: z.string().trim().max(30, "Teléfono demasiado largo").optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().trim().max(200).optional().or(z.literal("")),
});

export type NuevoProveedorValues = z.infer<typeof nuevoProveedorSchema>;
