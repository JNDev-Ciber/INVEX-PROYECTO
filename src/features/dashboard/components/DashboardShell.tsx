import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertCircle, Loader2, RefreshCw, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { DashboardSidebar } from "./layout/DashboardSidebar";
import { DashboardHeader } from "./layout/DashboardHeader";
import { useDashboardShell } from "@/features/dashboard/hooks/use-dashboard-shell";
import { useAuth, type AuthUser } from "@/features/auth/context/auth-context";
import { usePedidosWebPendientesCount } from "@/features/pedidos-web/hooks/use-pedidos-web";
import { usePlanStore } from "@/app/stores";
import { getSectionsForRole } from "@/features/dashboard/sections/registry";

interface DashboardShellProps {
  user: AuthUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const {
    isMobile,
    isLoading,
    error,
    connectionStatus,
    lowStockAlertsCount,
    retryConnection,
  } = useDashboardShell();

  // El badge solo se consulta si el usuario realmente ve Pedidos Web
  // (depende del rol y del plan), asi no pedimos la RPC al pedo.
  const plan = usePlanStore((s) => s.plan);
  const vePedidosWeb = getSectionsForRole(user.rol, plan ?? "invex").some(
    (s) => s.href === "/pedidos-web"
  );
  const pedidosWebPendientesCount = usePedidosWebPendientesCount(vePedidosWeb);

  const handleLogout = () => {
    logout();
    toast({
      title: (
        <span className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sesión cerrada
        </span>
      ),
      duration: 3000,
    });
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-md">
              <span className="text-primary-foreground font-extrabold text-lg">I</span>
            </div>
            <p className="text-sm font-medium text-foreground">INVEX</p>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">Cargando inventario...</p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar
          connectionStatus={connectionStatus}
          lowStockAlertsCount={lowStockAlertsCount}
          pedidosWebPendientesCount={pedidosWebPendientesCount}
          currentUser={user}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <DashboardHeader
            currentUser={user}
            isMobile={isMobile}
            showMobileMenu={showMobileMenu}
            setShowMobileMenu={setShowMobileMenu}
            connectionStatus={connectionStatus}
            lowStockAlertsCount={lowStockAlertsCount}
            pedidosWebPendientesCount={pedidosWebPendientesCount}
            onLogout={handleLogout}
          />

          <main className="flex-1 w-full px-3 sm:px-5 md:px-8 py-4 sm:py-5 md:py-6 space-y-4 md:space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Error de conexión</p>
                    <p className="text-sm opacity-90 mt-0.5">{error}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryConnection}
                    className="shrink-0 bg-white/10 hover:bg-white/20 border-white/30 text-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
