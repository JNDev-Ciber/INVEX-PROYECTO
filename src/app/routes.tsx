import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/app/RootLayout";

const LoginPage = lazy(() => import("@/features/auth/views/LoginPage"));
const DashboardView = lazy(() => import("@/features/dashboard/views/DashboardView"));
const ProductosListView = lazy(() => import("@/features/productos/views/ProductosListView"));
const ProductoAgregarView = lazy(() => import("@/features/productos/views/ProductoAgregarView"));
const ProductoEditarView = lazy(() => import("@/features/productos/views/ProductoEditarView"));
const ProductosOfertasView = lazy(() => import("@/features/productos/views/ProductosOfertasView"));
const ClientesView = lazy(() => import("@/features/clientes/views/ClientesView"));
const CrmView = lazy(() => import("@/features/crm/views/CrmView"));
const FacturaCompraView = lazy(() => import("@/features/facturas/views/FacturaCompraView"));
const FacturaVentaView = lazy(() => import("@/features/facturas/views/FacturaVentaView"));
const FacturaArcaView = lazy(() => import("@/features/facturas/views/FacturaArcaView"));
const PresupuestosView = lazy(() => import("@/features/presupuestos/views/PresupuestosView"));
const VentaRapidaView = lazy(() => import("@/features/ventas/views/VentaRapidaView"));
const AlertasView = lazy(() => import("@/features/inventario/views/AlertasView"));
const ColaCajaView = lazy(() => import("@/features/caja/views/ColaCajaView"));
const MovimientosView = lazy(() => import("@/features/inventario/views/MovimientosView"));
const CierreCajaView = lazy(() => import("@/features/inventario/views/CierreCajaView"));
const PreciosView = lazy(() => import("@/features/precios/views/PreciosView"));
const ReportesView = lazy(() => import("@/features/reportes/views/ReportesView"));
const UsuariosView = lazy(() => import("@/features/usuarios/views/UsuariosView"));
const EmpleadosView = lazy(() => import("@/features/empleados/views/EmpleadosView"));
const ProveedoresView = lazy(() => import("@/features/proveedores/views/ProveedoresView"));
const VentasEmpleadosView = lazy(() => import("@/features/ventas-empleados/views/VentasEmpleadosView"));
const PedidosWebView = lazy(() => import("@/features/pedidos-web/views/PedidosWebView"));
const AsistenteView = lazy(() => import("@/features/asistente/views/AsistenteView"));
const SucursalesView = lazy(() => import("@/features/sucursales/views/SucursalesView"));
const RemitosView = lazy(() => import("@/features/remitos/views/RemitosView"));
const NotFoundPage = lazy(() => import("@/app/NotFoundPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "dashboard", element: <DashboardView /> },
      { path: "productos", element: <ProductosListView /> },
      { path: "productos/agregar", element: <ProductoAgregarView /> },
      { path: "productos/editar/:id", element: <ProductoEditarView /> },
      { path: "productos/ofertas", element: <ProductosOfertasView /> },
      { path: "clientes", element: <ClientesView /> },
      { path: "clientes/crm", element: <CrmView /> },
      { path: "facturas/compra", element: <FacturaCompraView /> },
      { path: "facturas/venta", element: <FacturaVentaView /> },
      { path: "facturas/arca", element: <FacturaArcaView /> },
      { path: "presupuestos", element: <PresupuestosView /> },
      { path: "venta-rapida", element: <VentaRapidaView /> },
      { path: "alertas", element: <AlertasView /> },
      { path: "cola-caja", element: <ColaCajaView /> },
      { path: "movimientos", element: <MovimientosView /> },
      { path: "cerrar-caja", element: <CierreCajaView /> },
      { path: "precios", element: <PreciosView /> },
      { path: "reportes", element: <ReportesView /> },
      { path: "usuarios", element: <UsuariosView /> },
      { path: "empleados", element: <EmpleadosView /> },
      { path: "proveedores", element: <ProveedoresView /> },
      { path: "ventas-empleados", element: <VentasEmpleadosView /> },
      { path: "pedidos-web", element: <PedidosWebView /> },
      { path: "asistente", element: <AsistenteView /> },
      { path: "sucursales", element: <SucursalesView /> },
      { path: "remitos", element: <RemitosView /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
