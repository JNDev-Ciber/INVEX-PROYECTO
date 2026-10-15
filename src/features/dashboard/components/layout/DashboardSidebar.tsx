import { usePlanStore } from "@/app/stores";
import * as React from "react";
import { Link, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  getSectionsForRole,
  isSectionActive,
  type DashboardSection,
} from "@/features/dashboard/sections/registry";

type ConnectionStatus = "connecting" | "connected" | "error" | "offline";

function SidebarItem({
  section,
  active,
  disabled,
  lowStockAlertsCount,
  pedidosWebPendientesCount,
}: {
  section: DashboardSection;
  active: boolean;
  disabled: boolean;
  lowStockAlertsCount: number;
  pedidosWebPendientesCount: number;
}) {
  const Icon = section.icon;

  const inner = (
    <Link
      to={disabled ? "#" : section.href}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-sidebar-primary/15 text-sidebar-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        disabled ? "pointer-events-none opacity-40" : "",
        section.indented ? "ml-4 py-1.5 text-[13px]" : "",
      ].join(" ")}
    >
      <Icon
        className={[
          "shrink-0 transition-colors",
          section.indented ? "h-3.5 w-3.5" : "h-4 w-4",
          active ? "text-sidebar-primary" : section.iconColor,
        ].join(" ")}
      />
      <span className="flex-1 leading-none truncate">{section.label}</span>
      {section.showStockAlertBadge && lowStockAlertsCount > 0 && (
        <Badge
          variant="destructive"
          className="h-4 px-1 text-[10px] font-semibold shrink-0"
        >
          {lowStockAlertsCount}
        </Badge>
      )}
      {section.showPedidosWebBadge && pedidosWebPendientesCount > 0 && (
        <span
          className="relative flex shrink-0"
          title={`${pedidosWebPendientesCount} ${
            pedidosWebPendientesCount === 1
              ? "pedido web esperando aprobación"
              : "pedidos web esperando aprobación"
          }`}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-md bg-blue-500 opacity-60" />
          <Badge className="relative h-4 px-1 text-[10px] font-semibold bg-blue-600 hover:bg-blue-600 text-white border-transparent">
            {pedidosWebPendientesCount}
          </Badge>
        </span>
      )}
    </Link>
  );

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Requiere conexión
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}

export function DashboardSidebar({
  connectionStatus,
  lowStockAlertsCount,
  pedidosWebPendientesCount,
  currentUser,
}: {
  connectionStatus: ConnectionStatus;
  lowStockAlertsCount: number;
  pedidosWebPendientesCount: number;
  currentUser?: { id?: string | number; username: string; rol: string } | null;
}) {
  const pathname = useLocation().pathname ?? "";
  const plan = usePlanStore((s) => s.plan);
  const sections = getSectionsForRole(currentUser?.rol, plan ?? "invex");
  const isOffline = connectionStatus === "offline" || connectionStatus === "error";

  return (
    <aside className="hidden md:flex w-60 lg:w-64 xl:w-68 shrink-0 border-r border-sidebar-border bg-sidebar flex-col">
      <div className="flex flex-col h-screen sticky top-0">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-sidebar-border shrink-0">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">I</span>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              INVEX
            </span>
            <p className="text-[10px] text-sidebar-foreground/60 leading-none mt-0.5">
              Gestión de inventario
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
          {GROUP_ORDER.map((group) => {
            const items = sections.filter((s) => s.group === group);
            if (items.length === 0) return null;
            const label = GROUP_LABELS[group];
            return (
              <div key={group} className={group !== "main" ? "pt-4" : ""}>
                {label && (
                  <p className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest px-3 pb-1.5">
                    {label}
                  </p>
                )}
                {!label && group !== "main" && (
                  <div className="border-t border-sidebar-border mb-2" />
                )}
                <div className="space-y-0.5">
                  {items.map((section) => (
                    <SidebarItem
                      key={section.href}
                      section={section}
                      active={isSectionActive(pathname, section.href)}
                      disabled={Boolean(section.requiresConnection) && isOffline}
                      lowStockAlertsCount={lowStockAlertsCount}
                      pedidosWebPendientesCount={pedidosWebPendientesCount}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-sidebar-accent-foreground">
                {currentUser?.username?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate text-sidebar-foreground">{currentUser?.username}</p>
              <p className="text-[10px] text-sidebar-foreground/60 capitalize">
                {currentUser?.rol ?? "usuario"}
              </p>
            </div>
            {connectionStatus === "connected" && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="Conectado" />
            )}
            {(connectionStatus === "offline" || connectionStatus === "error") && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" title="Sin conexión" />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
