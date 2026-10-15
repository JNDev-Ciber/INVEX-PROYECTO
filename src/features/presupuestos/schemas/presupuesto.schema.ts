import { z } from "zod";

export const presupuestoSchema = z.object({
  numero: z.string().trim().min(1, "El número es obligatorio"),
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  clienteNombre: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  clienteTelefono: z.string().trim().optional().or(z.literal("")),
  observaciones: z.string().trim().optional().or(z.literal("")),
});

export type PresupuestoFormValues = z.infer<typeof presupuestoSchema>;
