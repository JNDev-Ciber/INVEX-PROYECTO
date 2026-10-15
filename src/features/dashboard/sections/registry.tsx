

import {
  AlertTriangle,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Contact,
  CreditCard,
  DollarSign,
  EarthIcon,
  Globe,
  List,
  Plus,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";

export type Role = "admin" | "vendedor" | "caja" | "encargado";

/** Planes de la instancia, de menor a mayor. */
export type PlanTier = "invex" | "pro" | "ia";

export const PLAN_NIVEL: Record<PlanTier, number> = {
  invex: 1,
  pro: 2,
  ia: 3,
};

export const PLAN_LABEL: Record<PlanTier, string> = {
  invex: "Invex",
  pro: "Invex Pro",
  ia: "Invex IA",
};

/**
 * ¿El plan actual incluye al menos el requerido?
 * - Sección sin `plan` (base): siempre incluida.
 * - Plan actual desconocido (todavía cargando): restrictivo (false).
 */
export function planIncluye(
  actual: PlanTier | null | undefined,
  requerido: PlanTier | undefined
): boolean {
  if (!requerido) return true;
  if (!actual) return false;
  return PLAN_NIVEL[actual] >= PLAN_NIVEL[requerido];
}

export type SectionGroup =
  | "main"
  | "facturacion"
  | "presupuesto"
  | "inventario"
  | "admin"
  | "rrhh";

export interface DashboardSection {
  /** ruta absoluta (URL) */
  href: string;
  /** texto visible en sidebar */
  label: string;
  /** descripción opcional (mobile menu) */
  description?: string;
  icon: LucideIcon;
  /** color del icono (Tailwind class) */
  iconColor: string;
  /** grupo en el sidebar */
  group: SectionGroup;
  /** roles que ven la sección. undefined = todos */
  roles?: Role[];
  /** plan mínimo que incluye la sección. undefined = plan base (todos) */
  plan?: PlanTier;
  /** sección requiere conexión activa para clickeable */
  requiresConnection?: boolean;
  /** muestra badge de stock bajo */
  showStockAlertBadge?: boolean;
  /** muestra badge con la cantidad de pedidos web esperando aprobacion */
  showPedidosWebBadge?: boolean;
  /** indenta visualmente (sub-item) */
  indented?: boolean;
  /** true = aparece en el menú hamburguesa mobile. Default false (el sidebar de escritorio siempre muestra todo) */
  mobileVisible?: boolean;
  /** oculta la sección del menú y bloquea su ruta (módulo sin uso todavía) */
  oculto?: boolean;
}

export const SECTIONS: DashboardSection[] = [
  // MAIN
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    iconColor: "text-red-600",
    group: "main",
    roles: ["admin", "caja"],
    mobileVisible: true,
  },
  {
    href: "/productos",
    label: "Productos",
    icon: List,
    iconColor: "text-red-600",
    group: "main",
    roles: ["admin", "caja"],
  },
  {
    href: "/productos/ofertas",
    label: "Ofertas",
    icon: Tag,
    iconColor: "text-red-600",
    group: "main",
    roles: ["admin", "caja"],
    indented: true,
  },
  {
    href: "/productos/agregar",
    label: "Agregar producto",
    icon: Plus,
    iconColor: "text-red-600",
    group: "main",
    roles: ["admin", "caja"],
    requiresConnection: true,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: User,
    iconColor: "text-blue-600",
    group: "main",
    roles: ["admin", "caja"],
  },
  {
    href: "/clientes/crm",
    label: "CRM",
    description: "Historial y seguimiento de clientes",
    icon: Contact,
    iconColor: "text-blue-600",
    group: "main",
    roles: ["admin", "caja"],
    plan: "pro",
    indented: true,
  },
  {
    href: "/venta-rapida",
    label: "Venta rápida",
    icon: ShoppingCart,
    iconColor: "text-green-600",
    group: "main",
    roles: ["caja", "vendedor"],
    requiresConnection: true,
    mobileVisible: true,
  },
  {
    href: "/precios",
    label: "Precios",
    icon: DollarSign,
    iconColor: "text-blue-600",
    group: "main",
    roles: ["caja"],
    requiresConnection: true,
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    iconColor: "text-blue-600",
    group: "main",
    roles: ["caja"],
    plan: "pro",
    mobileVisible: true,
  },
  {
    href: "/asistente",
    label: "Asistente IA",
    icon: Sparkles,
    iconColor: "text-purple-600",
    group: "main",
    roles: ["admin", "caja"],
    plan: "ia",
  },

  // FACTURACION
  {
    href: "/facturas/compra",
    label: "Compra",
    description: "Proveedores",
    icon: Building2,
    iconColor: "text-green-600",
    group: "facturacion",
    roles: ["admin", "caja"],
    plan: "pro",
    requiresConnection: true,
  },
  {
    href: "/cola-caja",
    label: "Cola de Caja",
    icon: ShoppingCart,
    iconColor: "text-green-600",
    group: "facturacion",
    roles: ["caja"],
    mobileVisible: true,
  },
  {
    href: "/facturas/venta",
    label: "Venta",
    description: "Clientes",
    icon: CreditCard,
    iconColor: "text-blue-600",
    group: "facturacion",
    roles: ["admin", "caja", "vendedor"],
    requiresConnection: true,
    mobileVisible: true,
  },
  {
    href: "/facturas/arca",
    label: "ARCA",
    icon: EarthIcon,
    iconColor: "text-black",
    group: "facturacion",
    roles: ["admin", "caja"],
    requiresConnection: true,
  },
  {
    href: "/pedidos-web",
    label: "Pedidos Web",
    description: "Pedidos del catálogo online",
    icon: Globe,
    iconColor: "text-blue-600",
    group: "facturacion",
    roles: ["admin", "caja"],
    plan: "pro",
    requiresConnection: true,
    showPedidosWebBadge: true,
  },

  // PRESUPUESTO
  {
    href: "/presupuestos",
    label: "Presupuestar",
    icon: DollarSign,
    iconColor: "text-green-600",
    group: "presupuesto",
    roles: ["admin", "caja", "vendedor"],
    requiresConnection: true,
    mobileVisible: true,
  },

  // INVENTARIO
  {
    href: "/movimientos",
    label: "Movimientos",
    icon: TrendingUp,
    iconColor: "text-blue-600",
    group: "inventario",
    roles: ["admin", "caja"],
    mobileVisible: true,
  },
  {
    href: "/cerrar-caja",
    label: "Cerrar Caja",
    icon: DollarSign,
    iconColor: "text-emerald-600",
    group: "inventario",
    roles: ["admin", "caja"],
    mobileVisible: true,
  },
  {
    href: "/alertas",
    label: "Alertas",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    group: "inventario",
    roles: ["caja"],
    showStockAlertBadge: true,
    mobileVisible: true,
  },

  {
    href: "/remitos",
    label: "Remitos",
    description: "Transferencias entre sucursales",
    icon: Truck,
    iconColor: "text-orange-600",
    group: "inventario",
    // Encargado: crea y envía. Resto: ve los de su sucursal y confirma la recepción.
    roles: ["encargado", "caja", "admin", "vendedor"],
    plan: "pro",
    oculto: true,
  },

  // ADMIN
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: Store,
    iconColor: "text-purple-600",
    group: "admin",
    roles: ["admin", "caja"],
    plan: "pro",
    oculto: true,
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: User,
    iconColor: "text-purple-600",
    group: "admin",
    roles: ["admin", "caja"],
  },
  {
    href: "/ventas-empleados",
    label: "Ventas por colaborador",
    icon: Award,
    iconColor: "text-purple-600",
    group: "admin",
    roles: ["caja"],
    plan: "pro",
  },

  // RRHH
  {
    href: "/empleados",
    label: "Colaboradores",
    icon: Briefcase,
    iconColor: "text-orange-600",
    group: "rrhh",
    roles: ["admin", "caja"],
    plan: "pro",
    requiresConnection: true,
  },
  {
    href: "/proveedores",
    label: "Proveedores",
    icon: Building2,
    iconColor: "text-orange-600",
    group: "main",
    roles: ["admin", "caja"],
    plan: "pro",
    requiresConnection: true,
  },
];

export const GROUP_LABELS: Record<SectionGroup, string | null> = {
  main: null,
  facturacion: "Facturación",
  presupuesto: "Presupuesto",
  inventario: null,
  admin: null,
  rrhh: null,
};

export const GROUP_ORDER: SectionGroup[] = [
  "main",
  "facturacion",
  "presupuesto",
  "inventario",
  "admin",
  "rrhh",
];

/**
 * Secciones visibles para el rol y el plan.
 * - `plan` undefined: no se filtra por plan (compatibilidad).
 * - `plan` null (cargando): se filtra restrictivo (solo base).
 */
export function getSectionsForRole(
  role?: string,
  plan?: PlanTier | null
): DashboardSection[] {
  return SECTIONS.filter((s) => {
    if (s.oculto) return false;
    const rolOk = !s.roles
      ? !role || role === "admin"
      : !role
        ? s.roles.includes("admin")
        : s.roles.includes(role as Role);
    if (!rolOk) return false;
    if (plan === undefined) return true;
    return planIncluye(plan, s.plan);
  });
}

function coincide(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Permiso de ruta según el mismo registro que arma el menú. Se toma la
 * sección más específica que coincide con la URL (ej. /productos/agregar
 * antes que /productos; /productos/editar/:id cae en /productos).
 * Devuelve null si la URL no pertenece a ninguna sección (404).
 */
export function puedeAccederRuta(role: string | undefined, pathname: string): boolean | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const seccion = SECTIONS.filter((s) => coincide(path, s.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
  if (!seccion) return null;
  return getSectionsForRole(role).includes(seccion);
}

/** Primera sección permitida para el rol (a donde se lo redirige). */
export function inicioParaRol(role?: string): string | null {
  return getSectionsForRole(role)[0]?.href ?? null;
}

/** Plan mínimo que exige la ruta (la sección más específica que coincide). */
export function planDeRuta(pathname: string): PlanTier | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  const seccion = SECTIONS.filter((s) => coincide(path, s.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
  return seccion?.plan;
}

/** ¿El plan actual incluye la ruta? Rutas sin sección (404) se permiten. */
export function rutaIncluidaEnPlan(
  plan: PlanTier | null | undefined,
  pathname: string
): boolean {
  return planIncluye(plan, planDeRuta(pathname));
}

export function isSectionActive(pathname: string, href: string): boolean {
  const stripped = pathname.replace(/\/+$/, "") || "/";
  const target = href.replace(/\/+$/, "") || "/";
  if (target === "/dashboard") return stripped === "/dashboard";
  // /productos coincide con /productos pero no con /productos/agregar (sub-items son explícitos)
  return stripped === target;
}
