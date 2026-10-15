import { create } from "zustand";
import type { PlanTier } from "@/features/dashboard/sections/registry";

interface PlanStore {
  /** Plan de la instancia. null mientras se carga. */
  plan: PlanTier | null;
  /** true una vez que se resolvió el plan (aunque sea por fallback). */
  cargado: boolean;
  setPlan: (plan: PlanTier) => void;
  reset: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
  plan: null,
  cargado: false,
  setPlan: (plan) => set({ plan, cargado: true }),
  reset: () => set({ plan: null, cargado: false }),
}));
