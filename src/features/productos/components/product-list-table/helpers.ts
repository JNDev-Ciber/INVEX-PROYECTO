import { AlertTriangle, Package } from "lucide-react";
import type { Product } from "@/shared/types/inventory";

export const normalizeText = (value: string) => {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const formatCurrency = (value: number) => {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
};

export const getStockStatus = (product: Product) => {
  if (product.quantity <= 0) {
    return {
      label: "Sin stock",
      variant: "destructive" as const,
      icon: AlertTriangle,
      color: "text-destructive",
    };
  }
  if (product.quantity <= product.minStock) {
    return {
      label: "Stock bajo",
      variant: "secondary" as const,
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    label: "En stock",
    variant: "default" as const,
    icon: Package,
    color: "text-[hsl(var(--income))]",
  };
};

export const getMarginColor = (margin: number) => {
  if (margin > 50) return "text-[hsl(var(--income))]";
  if (margin > 20) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
};
