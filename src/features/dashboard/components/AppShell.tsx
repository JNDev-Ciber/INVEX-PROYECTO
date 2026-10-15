import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogOut, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, usePlan } from "@/features/auth/context/auth-context";
import { useAuthHydration } from "@/app/stores/auth.store";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { PlanBloqueado } from "@/features/dashboard/components/PlanBloqueado";
import {
  inicioParaRol,
  planDeRuta,
  puedeAccederRuta,
  rutaIncluidaEnPlan,
} from "@/features/dashboard/sections/registry";

const PUBLIC_PATHS = new Set<string>(["/"]);
const SIN_ACCESO = "/sin-acceso";

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname ?? "/";
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { plan, cargado: planCargado } = usePlan();
  const isHydrated = useAuthHydration();

  // Una URL que no es de ninguna sección (404) se muestra aunque no haya
  // sesión: no tiene sentido mandar al login para ver "no existe".
  const esRutaDesconocida = puedeAccederRuta(undefined, pathname) === null;
  const isPublic = isPublicPath(pathname) || (!user && esRutaDesconocida);
  const inicio = user ? inicioParaRol(user.rol) : null;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isPublic && !user) {
      navigate("/", { replace: true });
    }
  }, [isHydrated, isPublic, user, navigate]);

  // Permisos por ruta: los mismos roles que el menú (sections/registry).
  // Escribir la URL a mano no saltea lo que el menú oculta. Las URLs que
  // no son de ninguna sección siguen de largo y muestran la página 404.
  useEffect(() => {
    if (!isHydrated || !user || isPublic) return;
    // Rol desconocido: a una pantalla propia, fuera de cualquier sección.
    if (!inicio) {
      if (pathname !== SIN_ACCESO) navigate(SIN_ACCESO, { replace: true });
      return;
    }
    if (puedeAccederRuta(user.rol, pathname) === false) {
      navigate(inicio, { replace: true });
    }
  }, [isHydrated, user, isPublic, inicio, pathname, navigate]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-md">
            <span className="text-primary-foreground font-extrabold text-lg">
              I
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">INVEX</p>
          <div className="flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Rol desconocido (ej. "user", el valor por defecto): no ve ninguna sección.
  if (!inicio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center space-y-4">
          <ShieldOff className="h-10 w-10 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <p className="text-base font-semibold">Tu usuario no tiene un rol asignado</p>
            <p className="text-sm text-muted-foreground">
              Pedile al administrador que te asigne un rol (vendedor o caja) desde Usuarios.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  // Mientras redirige una ruta no permitida, no mostrar su contenido.
  if (puedeAccederRuta(user.rol, pathname) === false) {
    return null;
  }

  // Gate por plan: el rol permite la ruta, pero el plan no la incluye.
  // Se muestra dentro del shell (con el menú) para poder navegar a otra.
  const planRequerido = planDeRuta(pathname);
  if (planCargado && planRequerido && !rutaIncluidaEnPlan(plan, pathname)) {
    return (
      <DashboardShell user={user}>
        <PlanBloqueado
          requerido={planRequerido}
          actual={plan}
          onVolver={() => navigate(inicio, { replace: true })}
        />
      </DashboardShell>
    );
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
