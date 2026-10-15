import { z } from "zod";

export const facturaCompraSchema = z.object({
  numero: z.string().trim().min(1, "El número es obligatorio"),
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  proveedorNombre: z
    .string()
    .trim()
    .min(1, "El nombre del proveedor es obligatorio"),
  proveedorCuit: z.string().trim().optional().or(z.literal("")),
  proveedorDireccion: z.string().trim().optional().or(z.literal("")),
  proveedorTelefono: z.string().trim().optional().or(z.literal("")),
  proveedorEmail: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  observaciones: z.string().trim().optional().or(z.literal("")),
  iva: z
    .number({ invalid_type_error: "El IVA debe ser un número" })
    .min(0, "El IVA no puede ser negativo")
    .max(100, "El IVA no puede ser mayor a 100"),
});

export type FacturaCompraFormValues = z.infer<typeof facturaCompraSchema>;
