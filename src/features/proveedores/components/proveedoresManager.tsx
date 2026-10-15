import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, DollarSign, History, Package, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Proveedor } from "@/shared/types/inventory";
import type { ProductoCompra } from "@/mocks/compras-proveedor";
import { NuevoProveedorForm } from "./proveedoresManager/NuevoProveedorForm";
import { ProveedoresGrid } from "./proveedoresManager/ProveedoresGrid";
import { ProveedorDeudaSidebar } from "./proveedoresManager/ProveedorDeudaSidebar";
import { NuevaCompraProductosTab } from "./proveedoresManager/NuevaCompraProductosTab";
import { DeudaManualProveedorTab } from "./proveedoresManager/DeudaManualProveedorTab";
import { HistorialProveedorList } from "./proveedoresManager/HistorialProveedorList";
import type { NuevoProveedorValues } from "@/features/proveedores/schemas/proveedor.schema";
import type { CompraProveedor, PagoProveedor } from "@/shared/types/inventory";
import type { Product } from "@/shared/types/inventory";

interface ProveedoresManagerProps {
  proveedores: Proveedor[];
  compras: CompraProveedor[];
  pagos: PagoProveedor[];
  products: Product[];
  isLoadingCompras: boolean;
  onAddProveedor: (
    nombre: string,
    cuit?: string,
    telefono?: string,
    email?: string,
    direccion?: string
  ) => Promise<any>;
  onDeleteProveedor: (proveedorId: string) => Promise<any>;
  onAddDeudaDirecta: (proveedorId: string, monto: number, concepto: string) => Promise<any>;
  onRegistrarPago: (proveedorId: string, monto: number, concepto?: string) => Promise<any>;
  onAddCompraProductos: (
    proveedorId: string,
    productos: ProductoCompra[],
    concepto?: string
  ) => Promise<any>;
  onProveedorSelect?: (id: string | undefined) => void;
  onSearchProductsPage?: (
    query: string,
    limit: number,
    offset: number,
    excludeOutOfStock: boolean
  ) => Promise<{ items: Product[]; hasMore: boolean }>;
}

export function ProveedoresManager({
  proveedores,
  compras,
  pagos,
  products,
  isLoadingCompras,
  onAddProveedor,
  onDeleteProveedor,
  onAddDeudaDirecta,
  onRegistrarPago,
  onAddCompraProductos,
  onProveedorSelect,
  onSearchProductsPage,
}: ProveedoresManagerProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDeuda, setFilterDeuda] = useState<"todos" | "saldo" | "pagado">("todos");
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tipoOperacion, setTipoOperacion] = useState<"productos" | "deuda">("productos");
  const [montoPago, setMontoPago] = useState("");
  const [montoDeuda, setMontoDeuda] = useState("");
  const [conceptoDeuda, setConceptoDeuda] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);
  const [remoteProductsLoading, setRemoteProductsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);

  const filteredProveedores = useMemo(
    () =>
      proveedores
        .filter(
          (p) =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cuit?.includes(searchTerm)
        )
        .filter((p) => {
          if (filterDeuda === "saldo") return p.saldoPendiente > 0;
          if (filterDeuda === "pagado") return p.saldoPendiente === 0;
          return true;
        }),
    [proveedores, searchTerm, filterDeuda]
  );

  useEffect(() => {
    const cleaned = productSearchTerm.trim();
    if (!cleaned || !onSearchProductsPage) {
      setRemoteProducts([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setRemoteProductsLoading(true);
        const res = await onSearchProductsPage(cleaned, 20, 0, false);
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
    const search = productSearchTerm.trim().toLowerCase();
    if (!search) return [];
    if (remoteProducts.length > 0) return remoteProducts;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.code.toLowerCase().includes(search)
    );
  }, [productSearchTerm, remoteProducts, products]);

  const handleAddProveedor = async (data: NuevoProveedorValues) => {
    setIsLoading(true);
    try {
      await onAddProveedor(
        data.nombre.trim(),
        data.cuit || undefined,
        data.telefono || undefined,
        data.email || undefined,
        data.direccion || undefined
      );
      setShowAddForm(false);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePago = async () => {
    if (!selectedProveedor || !montoPago) return;
    const monto = parseFloat(montoPago);
    if (monto <= 0 || monto > selectedProveedor.saldoPendiente) return;
    setIsLoading(true);
    try {
      await onRegistrarPago(selectedProveedor.id, monto);
      const nuevoSaldo = Math.max(0, selectedProveedor.saldoPendiente - monto);
      setSelectedProveedor({ ...selectedProveedor, saldoPendiente: nuevoSaldo });
      setMontoPago("");
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeudaManual = async () => {
    if (!selectedProveedor) return;
    const monto = parseFloat(montoDeuda);
    if (isNaN(monto) || monto <= 0) {
      alert("Ingresá un monto válido mayor a 0");
      return;
    }
    setIsLoading(true);
    try {
      await onAddDeudaDirecta(
        selectedProveedor.id,
        monto,
        conceptoDeuda || "Deuda manual"
      );
      setMontoDeuda("");
      setConceptoDeuda("");
      setTipoOperacion("productos");
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompraProductos = async (
    items: ProductoCompra[],
    concepto?: string
  ) => {
    if (!selectedProveedor) return;
    setIsLoading(true);
    try {
      await onAddCompraProductos(selectedProveedor.id, items, concepto);
      setTipoOperacion("productos");
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (proveedor: Proveedor, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProveedorToDelete(proveedor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!proveedorToDelete) return;
    setIsLoading(true);
    try {
      await onDeleteProveedor(proveedorToDelete.id);
      setShowDeleteModal(false);
      setProveedorToDelete(null);
      if (selectedProveedor?.id === proveedorToDelete.id) setSelectedProveedor(null);
      toast({ title: "Proveedor eliminado", duration: 3000 });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // — Vista proveedor seleccionado —
  if (selectedProveedor) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-bold truncate">{selectedProveedor.nombre}</h2>
            {selectedProveedor.cuit && (
              <p className="text-sm text-muted-foreground">{selectedProveedor.cuit}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => openDeleteModal(selectedProveedor, e)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSelectedProveedor(null); onProveedorSelect?.(undefined); }}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <ProveedorDeudaSidebar
            selectedProveedor={selectedProveedor}
            montoPago={montoPago}
            setMontoPago={setMontoPago}
            isLoading={isLoading}
            onPago={handlePago}
          />

          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Nueva operación
              </h4>
              <div className="flex gap-2 mb-3">
                <Button
                  variant={tipoOperacion === "productos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoOperacion("productos")}
                  className="flex-1"
                >
                  <Package className="h-4 w-4 mr-1" />
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

              {tipoOperacion === "productos" && (
                <NuevaCompraProductosTab
                  suggestedProducts={suggestedProducts}
                  productSearchTerm={productSearchTerm}
                  setProductSearchTerm={setProductSearchTerm}
                  isLoading={isLoading || remoteProductsLoading}
                  onRegistrarCompra={handleCompraProductos}
                />
              )}

              {tipoOperacion === "deuda" && (
                <DeudaManualProveedorTab
                  montoDeuda={montoDeuda}
                  setMontoDeuda={setMontoDeuda}
                  conceptoDeuda={conceptoDeuda}
                  setConceptoDeuda={setConceptoDeuda}
                  isLoading={isLoading}
                  onRegistrarDeuda={handleDeudaManual}
                />
              )}
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Cuenta corriente
              </h4>
              <div className="flex items-center gap-2 border-b pb-2 mb-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">
                  Historial ({compras.length + pagos.length})
                </h4>
              </div>

              <HistorialProveedorList
                compras={compras}
                pagos={pagos}
                isLoading={isLoadingCompras}
              />
            </Card>
          </div>
        </div>

        <AlertDialog
          open={showDeleteModal && !!proveedorToDelete}
          onOpenChange={(open) => {
            if (!open) { setShowDeleteModal(false); setProveedorToDelete(null); }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Eliminar a {proveedorToDelete?.nombre}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {proveedorToDelete && proveedorToDelete.saldoPendiente > 0
                  ? `Este proveedor tiene una deuda de $${proveedorToDelete.saldoPendiente.toLocaleString()}. `
                  : ""}
                Esta acción no se puede deshacer. Se eliminarán todos los
                datos asociados al proveedor.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={confirmDelete}
                disabled={isLoading}
              >
                {isLoading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // — Vista lista —
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold truncate">Proveedores</h3>
          <p className="text-sm text-muted-foreground">
            Compras, deudas y pagos a proveedores
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo proveedor
        </Button>
      </div>

      {showAddForm && (
        <NuevoProveedorForm
          isLoading={isLoading}
          onClose={() => setShowAddForm(false)}
          onSave={handleAddProveedor}
        />
      )}

      <ProveedoresGrid
        proveedores={proveedores}
        filteredProveedores={filteredProveedores}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterDeuda={filterDeuda}
        setFilterDeuda={setFilterDeuda}
        onSelectProveedor={(p) => {
          setSelectedProveedor(p);
          onProveedorSelect?.(p.id);
          setTipoOperacion("productos");
          setMontoPago("");
        }}
        onDeleteProveedor={openDeleteModal}
      />

      <AlertDialog
        open={showDeleteModal && !!proveedorToDelete}
        onOpenChange={(open) => {
          if (!open) { setShowDeleteModal(false); setProveedorToDelete(null); }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar a {proveedorToDelete?.nombre}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {proveedorToDelete && proveedorToDelete.saldoPendiente > 0
                ? `Este proveedor tiene una deuda de $${proveedorToDelete.saldoPendiente.toLocaleString()}. `
                : ""}
              Esta acción no se puede deshacer. Se eliminarán todos los datos
              asociados al proveedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
