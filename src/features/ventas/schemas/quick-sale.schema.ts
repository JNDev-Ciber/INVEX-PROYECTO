import { z } from "zod";

export const barcodeSchema = z.object({
  barcode: z
    .string()
    .trim()
    .regex(/^\d{5,128}$/, "Código de barras inválido (5-128 dígitos)"),
});

export type BarcodeValues = z.infer<typeof barcodeSchema>;
