import { useEffect } from "react";
import { useAuthStore, usePlanStore, useSucursalStore, type AuthUser } from "@/app/stores";
import { getSessionUser, logoutUser, obtenerPlan } from "@/mocks/auth";
import type { PlanTier } from "@/features/dashboard/sections/registry";

export { type AuthUser };

/** Carga el plan de la instancia en el store (idempotente). */
function cargarPlan() {
  obtenerPlan().then((plan) => usePlanStore.getState().setPlan(plan));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, setSessionChecked } = useAuthStore();

  useEffect(() => {
    getSessionUser().then((user) => {
      if (user) {
        login(user);
        cargarPlan();
      }
      setSessionChecked();
    });
  }, []);

  return <>{children}</>;
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const storeLogin = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);

  const login = (u: AuthUser) => {
    storeLogin(u);
    cargarPlan();
  };

  const logout = async () => {
    await logoutUser();
    // Que el próximo usuario no arranque operando en la sucursal del anterior.
    useSucursalStore.getState().setSucursalOperacionId(null);
    usePlanStore.getState().reset();
    storeLogout();
  };

  return { user, isLoggedIn, login, logout };
}

/** Plan de la instancia y si ya se resolvió (para gatear rutas/menú). */
export function usePlan(): { plan: PlanTier | null; cargado: boolean } {
  const plan = usePlanStore((s) => s.plan);
  const cargado = usePlanStore((s) => s.cargado);
  return { plan, cargado };
}

export function useCurrentUser(): AuthUser | null {
  return useAuthStore((state) => state.user);
}

export function useRequireUser(): AuthUser {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    throw new Error("useRequireUser must be used within AuthProvider with an active session");
  }
  return user;
}
