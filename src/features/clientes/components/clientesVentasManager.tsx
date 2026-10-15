

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  Plus,
  ArrowLeft,
  Trash2,
  ShoppingCart,
  Package,
} from "lucide-react";
import type {
  ClienteVenta,
  VentaFiado,
  Product,
  Pago,
} from "@/shared/types/inventory";
import { DeleteClienteModal } from "./clientesVentasManager/DeleteClienteModal";
import { NuevoClienteForm } from "./clientesVentasManager/NuevoClienteForm";
import { ClientesGrid } from "./clientesVentasManager/ClientesGrid";
import { ClienteDeudaSidebar } from "./clientesVentasManager/ClienteDeudaSidebar";
import { NuevaVentaProductosTab } from "./clientesVentasManager/NuevaVentaProductosTab";
import { DeudaManualTab } from "./clientesVentasManager/DeudaManualTab";
import { VentasAPagarList } from "./clientesVentasManager/VentasAPagarList";
import { HistorialList } from "./clientesVentasManager/HistorialList";

interface ClientesVentasManagerProps {
  clientes: ClienteVenta[];
  ventasFiado: VentaFiado[];
  pagos: Pago[];
  products: Product[];
  onAddCliente?: (
    nombre: string,
    cuit: string,
    telefono: string
  ) => Promise<boolean>;
  onAddVentaFiado: (
    clienteId: number,
    productos: any[]
  ) => Promise<{ success: boolean; ventaId: any; total: number }>;
  onMarcarPagados: (detalleIds: number[], ventaId: number) => Promise<boolean>;
  onDeleteCliente?: (clienteId: number) => Promise<boolean>;
  onAddDeudaDirecta?: (
    clienteId: number,
    monto: number,
    concepto: string
  ) => Promise<boolean>;
  onRegistrarPagoParcial?: (
    clienteId: number,
    monto: number
  ) => Promise<boolean>;
  onAddMovimiento?: (
    productId: string | null,
    type: "entrada" | "salida",
    quantity: number,
    reason: string,
    amount: number
  ) => Promise<void>;

  onSearchProductsPage?: (
    query: string,
    limit: number,
    offset: number,
    excludeOutOfStock: boolean
  ) => Promise<{ items: Product[]; hasMore: boolean }>;
}

export function ClientesVentasManager({
  clientes,
  ventasFiado,
  products,
  pagos,
  onAddCliente,
  onAddVentaFiado,
  onMarcarPagados,
  onRegistrarPagoParcial,
  onDeleteCliente,
  onAddDeudaDirecta,
  onAddMovimiento,
  onSearchProductsPage,
}: ClientesVentasManagerProps) {
  // ✅ TODOS LOS ESTADOS DECLARADOS CORRECTAMENTE
  const [searchTerm, setSearchTerm] = useState("");
  const [montoPago, setMontoPago] = useState<string>("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);
  const [remoteProductsLoading, setRemoteProductsLoading] = useState(false);
  const [tipoOperacion, setTipoOperacion] = useState<"productos" | "deuda">(
    "productos"
  );
  const [montoDeuda, setMontoDeuda] = useState<string>("");
  const [conceptoDeuda, setConceptoDeuda] = useState<string>("");

  const [filterDeuda, setFilterDeuda] = useState<"todos" | "saldo" | "pagado">(
    "todos"
  );
  // Guardamos solo el id: la ficha se deriva en vivo de `clientes`, así el
  // saldo se actualiza solo cuando una mutación invalida la query (antes se
  // mostraba un snapshot viejo, "Sin deudas", y se recargaba toda la página).
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(
    null
  );
  const [showAddClienteForm, setShowAddClienteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagoState, setPagoState] = useState<{ [detalleId: number]: boolean }>(
    {}
  );
  const [activeTab, setActiveTab] = useState<"pagar" | "historial">("pagar");
  const [productosVenta, setProductosVenta] = useState<
    Array<{ productoId: string; cantidad: number; product?: Product }>
  >([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<ClienteVenta | null>(
    null
  );

  const { toast } = useToast();

  const selectedCliente = useMemo(
    () =>
      selectedClienteId == null
        ? null
        : clientes.find((c) => c.id === selectedClienteId) ?? null,
    [clientes, selectedClienteId]
  );

  const handlePagoParcial = async () => {
    if (!selectedCliente || !montoPago) return;

    if (!onRegistrarPagoParcial) {
      console.error("⚠️ Función de pago no disponible");
      return;
    }

    const monto = parseFloat(montoPago);

    if (monto <= 0 || monto > selectedCliente.saldoPendiente) {
      console.error("⚠️ Monto inválido");
      return;
    }

    setIsLoading(true);
    try {
      await onRegistrarPagoParcial(selectedCliente.id, monto);
      // La ficha se refresca sola al invalidarse la query; el saldo baja.
      setMontoPago("");
      toast({
        title: "Pago registrado",
        description: `Se registró un pago de $${monto.toLocaleString("es-AR")}`,
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "No se pudo registrar el pago",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClientes = useMemo(() => {
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.cuit?.includes(searchTerm)
      )
      .filter((c) => {
        if (filterDeuda === "saldo") return c.saldoPendiente > 0;
        if (filterDeuda === "pagado") return c.saldoPendiente === 0;
        return true;
      });
  }, [clientes, searchTerm, filterDeuda]);

  const filteredProducts = useMemo(() => {
    const search = productSearchTerm.toLowerCase().trim();
    if (!search) return [];
    return products.filter(
      (p) =>
        p.quantity > 0 &&
        (p.name.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search) ||
          p.barcode?.toLowerCase().includes(search))
    );
  }, [products, productSearchTerm]);

  useEffect(() => {
    const cleaned = productSearchTerm.trim();
    if (!cleaned) {
      setRemoteProducts([]);
      setRemoteProductsLoading(false);
      return;
    }

    if (!onSearchProductsPage) {
      setRemoteProducts([]);
      setRemoteProductsLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setRemoteProductsLoading(true);
        const res = await onSearchProductsPage(cleaned, 20, 0, true);
        setRemoteProducts(res.items || []);
      } catch {
        setRemoteProducts([]);
      } finally {
        setRemoteProductsLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [productSearchTerm, onSearchProductsPage]);

  const suggestedProducts = useMemo(() => {
    const search = productSearchTerm.trim();
    if (!search) return [];
    if (remoteProducts.length > 0) return remoteProducts;
    return filteredProducts;
  }, [productSearchTerm, remoteProducts, filteredProducts]);

  const allKnownProducts = useMemo(() => {
    const byId = new Map<string, Product>();
    (products || []).forEach((p) => {
      if (p?.id) byId.set(p.id, p);
    });
    (remoteProducts || []).forEach((p) => {
      if (p?.id && !byId.has(p.id)) byId.set(p.id, p);
    });
    return Array.from(byId.values());
  }, [products, remoteProducts]);

  const clienteVentasAbiertas = (clienteId: number) =>
    ventasFiado.filter(
      (v) => v.clienteId === clienteId && v.saldoPendiente > 0
    );

  const clienteHistorialCompleto = (clienteId: number) =>
    ventasFiado.filter((v) => v.clienteId === clienteId);

  const handleAddCliente = async (data: {
    nombre: string;
    cuit?: string;
    telefono?: string;
  }) => {
    if (!onAddCliente) {
      toast({ title: "Función no disponible", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await onAddCliente(
        data.nombre.trim(),
        (data.cuit ?? "").trim(),
        (data.telefono ?? "").trim()
      );
      setShowAddClienteForm(false);
    } catch (err) {
      toast({
        title: "No se pudo agregar el cliente",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotalVenta = () => {
    return productosVenta.reduce((total, item) => {
      const producto =
        item.product ??
        allKnownProducts.find((p) => p.id === item.productoId);
      if (producto) {
        return total + producto.price * item.cantidad;
      }
      return total;
    }, 0);
  };

  const agregarProductoRapido = (product: Product) => {
    const productoId = product.id;
    const yaExiste = productosVenta.find((p) => p.productoId === productoId);
    if (yaExiste) {
      setProductosVenta(
        productosVenta.map((p) =>
          p.productoId === productoId
            ? { ...p, cantidad: p.cantidad + 1, product: p.product ?? product }
            : p
        )
      );
    } else {
      setProductosVenta([
        ...productosVenta,
        { productoId, cantidad: 1, product },
      ]);
    }
  };

  const handleRegistrarVenta = async () => {
    if (!selectedCliente || productosVenta.length === 0) return;
    const productosValidos = productosVenta.every(
      (p) => p.productoId && p.cantidad > 0
    );
    if (!productosValidos) {
      toast({
        title: "Faltan datos",
        description: "Todos los productos deben estar seleccionados",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await onAddVentaFiado(
        selectedCliente.id,
        productosVenta.map(({ productoId, cantidad }) => ({
          productoId,
          cantidad,
        }))
      );
      setProductosVenta([]);
      setProductSearchTerm("");
      setActiveTab("pagar");
      toast({ title: "Venta a crédito registrada", duration: 3000 });
    } catch (err) {
      toast({
        title: "No se pudo registrar la venta",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarcarPagados = async (
    detallesSeleccionados: number[],
    ventaId: number
  ) => {
    try {
      await onMarcarPagados(detallesSeleccionados, ventaId);

      const venta = ventasFiado.find((v) => v.id === ventaId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const openDeleteModal = (cliente: ClienteVenta, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setClienteToDelete(cliente);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;

    setIsLoading(true);
    try {
      if (onDeleteCliente) {
        await onDeleteCliente(clienteToDelete.id);
      }

      setShowDeleteModal(false);
      setClienteToDelete(null);
      if (selectedClienteId === clienteToDelete.id) {
        setSelectedClienteId(null);
      }
      toast({ title: "Cliente eliminado", duration: 3000 });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrarDeudaManual = async () => {
    if (!selectedCliente) return;
    if (!onAddDeudaDirecta) {
      toast({ title: "Función no disponible", variant: "destructive" });
      return;
    }
    const monto = parseFloat(montoDeuda);
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresá un monto mayor a 0",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await onAddDeudaDirecta(
        selectedCliente.id,
        monto,
        conceptoDeuda || "Deuda manual"
      );
      setMontoDeuda("");
      setConceptoDeuda("");
      setActiveTab("pagar");
      setTipoOperacion("productos");
      // La ficha se refresca sola al invalidarse la query de clientes.
      toast({
        title: "Deuda registrada",
        description: `Se agregó una deuda de $${monto.toLocaleString("es-AR")}`,
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "No se pudo registrar la deuda",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // VISTA CON CLIENTE SELECCIONADO
  if (selectedCliente) {
    const ventasAb = clienteVentasAbiertas(selectedCliente.id);
    const todasVentas = clienteHistorialCompleto(selectedCliente.id);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-bold truncate">{selectedCliente.nombre}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCliente.cuit}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => openDeleteModal(selectedCliente, e)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedClienteId(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* COLUMNA IZQUIERDA: Info del Cliente */}
          <ClienteDeudaSidebar
            selectedCliente={selectedCliente}
            montoPago={montoPago}
            setMontoPago={setMontoPago}
            isLoading={isLoading}
            onPagoParcial={handlePagoParcial}
          />

          {/* COLUMNA DERECHA: Venta + Historial */}
          <div className="lg:col-span-4 space-y-4">
            {/* NUEVA VENTA / DEUDA MANUAL CON TABS */}
            <Card className="p-4 bg-card ">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Nueva operación
              </h4>
              {/* Tabs de operación */}
              <div className="flex gap-2 mb-3">
                <Button
                  variant={
                    tipoOperacion === "productos" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setTipoOperacion("productos")}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Productos
                </Button>
                <Button
                  variant={tipoOperacion === "deuda" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoOperacion("deuda")}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Deuda Manual
                </Button>
              </div>

              {/* TAB: PRODUCTOS */}
              {tipoOperacion === "productos" && (
                <NuevaVentaProductosTab
                  productSearchTerm={productSearchTerm}
                  setProductSearchTerm={setProductSearchTerm}
                  suggestedProducts={suggestedProducts}
                  productosVenta={productosVenta}
                  setProductosVenta={setProductosVenta}
                  allKnownProducts={allKnownProducts}
                  isLoading={isLoading}
                  calcularTotalVenta={calcularTotalVenta}
                  agregarProductoRapido={agregarProductoRapido}
                  onRegistrarVenta={handleRegistrarVenta}
                />
              )}

              {/* TAB: DEUDA MANUAL */}
              {tipoOperacion === "deuda" && (
                <DeudaManualTab
                  montoDeuda={montoDeuda}
                  setMontoDeuda={setMontoDeuda}
                  conceptoDeuda={conceptoDeuda}
                  setConceptoDeuda={setConceptoDeuda}
                  isLoading={isLoading}
                  onRegistrarDeuda={handleRegistrarDeudaManual}
                />
              )}
            </Card>

            {/* Cuenta corriente */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Cuenta corriente
              </h4>
              <div className="flex gap-2 border-b">
                <Button
                  variant={activeTab === "pagar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("pagar")}
                >
                  <DollarSign className="h-4 w-4 mr-1" />A Pagar (
                  {ventasAb.length})
                </Button>
                <Button
                  variant={activeTab === "historial" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("historial")}
                >
                  <Package className="h-4 w-4 mr-1" />
                  Historial (
                  {todasVentas.length +
                    pagos.filter((p) => p.cliente_id === selectedCliente.id)
                      .length}
                  )
                </Button>
              </div>

              {/* TAB: A PAGAR */}
              {activeTab === "pagar" && (
                <VentasAPagarList
                  ventasAb={ventasAb}
                  pagoState={pagoState}
                  setPagoState={setPagoState}
                  isLoading={isLoading}
                  onMarcarPagados={handleMarcarPagados}
                />
              )}

              {/* TAB: HISTORIAL */}
              {activeTab === "historial" && (
                <HistorialList
                  selectedCliente={selectedCliente}
                  todasVentas={todasVentas}
                  pagos={pagos}
                  isLoading={isLoading}
                />
              )}
            </Card>
          </div>
        </div>

        {/* ⬅️ MODAL DE ELIMINACIÓN - AQUÍ DENTRO */}
        {showDeleteModal && clienteToDelete && (
          <DeleteClienteModal
            clienteToDelete={clienteToDelete}
            isLoading={isLoading}
            onCancel={() => {
              setShowDeleteModal(false);
              setClienteToDelete(null);
            }}
            onConfirm={confirmDelete}
          />
        )}
      </div>
    );
  }

  // VISTA NORMAL: Lista de clientes
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold truncate">Clientes</h3>
          <p className="text-sm text-muted-foreground">
            Administración de cuentas, ventas a crédito y pagos
          </p>
        </div>
        <Button
          onClick={() => setShowAddClienteForm(!showAddClienteForm)}
          size="sm"
          className="self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo cliente
        </Button>
      </div>

      {showAddClienteForm && (
        <NuevoClienteForm
          isLoading={isLoading}
          onClose={() => setShowAddClienteForm(false)}
          onSave={handleAddCliente}
        />
      )}

      <ClientesGrid
        clientes={clientes}
        filteredClientes={filteredClientes}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterDeuda={filterDeuda}
        setFilterDeuda={setFilterDeuda}
        onSelectCliente={(c) => {
          setSelectedClienteId(c.id);
          setActiveTab("pagar");
          setTipoOperacion("productos");
        }}
        onDeleteCliente={openDeleteModal}
      />

      {/* ⬅️ MODAL DE ELIMINACIÓN */}
      {showDeleteModal && clienteToDelete && (
        <DeleteClienteModal
          clienteToDelete={clienteToDelete}
          isLoading={isLoading}
          onCancel={() => {
            setShowDeleteModal(false);
            setClienteToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
