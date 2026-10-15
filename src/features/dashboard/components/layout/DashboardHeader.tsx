import { Link, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, X, Wifi, WifiOff } from "lucide-react";
import { usePlanStore } from "@/app/stores";
import { ThemeToggle } from "@/shared/components/layout/theme-toggle";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  getSectionsForRole,
  isSectionActive,
} from "@/features/dashboard/sections/registry";

type ConnectionStatus = "connecting" | "connected" | "error" | "offline";

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  if (status === "offline" || status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <WifiOff className="h-3 w-3" />
        <span className="hidden sm:inline">Sin conexión</span>
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
        <span className="hidden sm:inline">Conectando</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="hidden sm:inline">En línea</span>
    </span>
  );
}

export function DashboardHeader({
  currentUser,
  isMobile,
  showMobileMenu,
  setShowMobileMenu,
  connectionStatus,
  lowStockAlertsCount,
  pedidosWebPendientesCount,
  onLogout,
}: {
  currentUser?: { id?: string | number; username: string; rol: string } | null;
  isMobile: boolean;
  showMobileMenu: boolean;
  setShowMobileMenu: (open: boolean) => void;
  connectionStatus: ConnectionStatus;
  lowStockAlertsCount: number;
  pedidosWebPendientesCount: number;
  onLogout: () => void;
}) {
  const pathname = useLocation().pathname ?? "";
  const plan = usePlanStore((s) => s.plan);
  const sections = getSectionsForRole(currentUser?.rol, plan ?? "invex").filter((s) => s.mobileVisible);
  const isOffline = connectionStatus === "offline" || connectionStatus === "error";

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">

        {/* Izquierda: logo mobile + usuario */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="md:hidden h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-xs">I</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate max-w-[140px] sm:max-w-xs leading-none">
              {currentUser?.username}
            </p>
            <p className="text-xs text-muted-foreground capitalize leading-none mt-0.5 hidden sm:block">
              {currentUser?.rol ?? "usuario"}
            </p>
          </div>
        </div>

        {/* Derecha: estado, acciones */}
        <div className="flex items-center gap-2 shrink-0">
          <ConnectionDot status={connectionStatus} />

          {lowStockAlertsCount > 0 && (
            <Link to="/alertas">
              <Badge variant="destructive" className="h-5 px-1.5 text-xs hidden sm:flex">
                {lowStockAlertsCount} alertas
              </Badge>
            </Link>
          )}

          <ThemeToggle />

          {/* Menú hamburguesa mobile */}
          {isMobile && (
            <DropdownMenu open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Menú"
                >
                  {showMobileMenu ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 max-h-[80dvh] overflow-y-auto scrollbar-thin p-1"
                sideOffset={6}
              >
                {/* Cabecera del menú */}
                <div className="px-3 py-2.5 mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Navegación
                  </p>
                </div>
                <DropdownMenuSeparator />

                {GROUP_ORDER.map((group) => {
                  const items = sections.filter((s) => s.group === group);
                  if (items.length === 0) return null;
                  const label = GROUP_LABELS[group];
                  return (
                    <div key={group} className="py-1">
                      {label && (
                        <p className="text-xs font-medium text-muted-foreground px-3 py-1.5 uppercase tracking-wider">
                          {label}
                        </p>
                      )}
                      {items.map((section) => {
                        const Icon = section.icon;
                        const active = isSectionActive(pathname, section.href);
                        const disabled = Boolean(section.requiresConnection) && isOffline;
                        return (
                          <Link
                            key={section.href}
                            to={disabled ? "#" : section.href}
                            onClick={() => !disabled && setShowMobileMenu(false)}
                            className={[
                              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors mx-1",
                              active
                                ? "bg-accent text-accent-foreground font-medium"
                                : "hover:bg-accent hover:text-accent-foreground",
                              disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                            ].join(" ")}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${section.iconColor}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium leading-none">{section.label}</p>
                              {section.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {section.description}
                                </p>
                              )}
                            </div>
                            {section.showStockAlertBadge && lowStockAlertsCount > 0 && (
                              <Badge variant="destructive" className="text-xs h-5 px-1.5 shrink-0">
                                {lowStockAlertsCount}
                              </Badge>
                            )}
                            {section.showPedidosWebBadge && pedidosWebPendientesCount > 0 && (
                              <Badge className="text-xs h-5 px-1.5 shrink-0 bg-blue-600 hover:bg-blue-600 text-white border-transparent">
                                {pedidosWebPendientesCount}
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}

                <DropdownMenuSeparator />
                <div className="p-1">
                  <button
                    onClick={() => { setShowMobileMenu(false); onLogout(); }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Cerrar sesión</span>
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Logout desktop */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
