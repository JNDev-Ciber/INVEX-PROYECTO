import { z } from "zod";

// Schema para FacturaVentaForm. Notar que en ventas, el cliente es opcional
// a nivel del schema (se permite venta casual en algunos flujos). La validación
// "el nombre del cliente es obligatorio" se aplica de forma específica en los
// handlers que sí lo requieren (procesarFacturaVenta, handleDejarAFiado,
// enviarBoletaPendienteHandler), replicando el comportamiento original.
export const facturaVentaSchema = z.object({
  numero: z.string().trim().min(1, "El número es obligatorio"),
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  clienteNombre: z.string().trim().optional().or(z.literal("")),
  clienteCuit: z.string().trim().optional().or(z.literal("")),
  clienteDireccion: z.string().trim().optional().or(z.literal("")),
  clienteTelefono: z.string().trim().optional().or(z.literal("")),
  clienteEmail: z
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

export type FacturaVentaFormValues = z.infer<typeof facturaVentaSchema>;
