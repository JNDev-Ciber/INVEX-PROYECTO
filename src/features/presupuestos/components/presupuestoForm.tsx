

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import {
  Plus, Trash2, Search, Package, X,
  Minus, BarChart3, FileText, RefreshCw, User, Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ClienteSelector } from "@/features/clientes/components/ClienteSelector";
import { useAgregarSeguimiento } from "@/features/crm/hooks/use-crm";
import { useAuthStore } from "@/app/stores";
import { esAdmin } from "@/shared/lib/roles";
import type { ClienteVenta } from "@/shared/types/inventory";
import {
  presupuestoSchema,
  type PresupuestoFormValues,
} from "../schemas/presupuesto.schema";
import type { Product } from "@/shared/types/inventory";

//  Interfaces

interface PresupuestoItem {
  id: string;
  producto: Product;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Props {
  products?: Product[];
  onSearchProductsPage?: (
    query: string, limit: number, offset: number, excludeOutOfStock: boolean
  ) => Promise<{ items: Product[]; hasMore: boolean }>;
  onLookupProductByBarcode?: (barcode: string) => Promise<Product | undefined>;
}

//  Helpers

const genNumero = () => {
  const d = new Date();
  return `PRES-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}${String(d.getSeconds()).padStart(2,"0")}`;
};

const defaultFormValues = (): PresupuestoFormValues => ({
  numero: genNumero(),
  fecha: new Date().toISOString().split("T")[0],
  clienteNombre: "",
  clienteTelefono: "",
  observaciones: "",
});

//  Componente

export default function PresupuestoForm({ products = [], onSearchProductsPage, onLookupProductByBarcode }: Props) {
  const { toast } = useToast();

  const form = useForm<PresupuestoFormValues>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: defaultFormValues(),
    mode: "onBlur",
  });

  const [items, setItems] = useState<PresupuestoItem[]>([]);
  // Cliente del CRM (opcional): completa nombre y teléfono y, para dueño y
  // caja, deja el presupuesto anotado en su ficha.
  const [cliente, setCliente] = useState<ClienteVenta | null>(null);
  const rol = useAuthStore((s) => s.user?.rol);
  const agregarSeguimiento = useAgregarSeguimiento();

  const elegirCliente = (c: ClienteVenta | null) => {
    setCliente(c);
    if (c) {
      form.setValue("clienteNombre", c.nombre, { shouldValidate: true });
      form.setValue("clienteTelefono", c.telefono ?? "");
    }
  };
  const [prodSel, setProdSel] = useState<Product | null>(null);
  const [nuevoItem, setNuevoItem] = useState({ cantidad: "", precioUnitario: "" });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [iva, setIva] = useState(0);
  const [serverItems, setServerItems] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Totales (derivados de items + iva)
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.subtotal, 0),
    [items]
  );
  const ivaVal = useMemo(() => (subtotal * iva) / 100, [subtotal, iva]);
  const total = useMemo(() => subtotal + ivaVal, [subtotal, ivaVal]);

  // Búsqueda server
  useEffect(() => {
    let canceled = false;
    const run = async () => {
      const term = busqueda.trim();
      if (!term || !onSearchProductsPage) { setServerItems([]); return; }
      try {
        const res = await onSearchProductsPage(term, 200, 0, false);
        if (!canceled) setServerItems(res.items);
      } catch { if (!canceled) setServerItems([]); }
    };
    const t = setTimeout(() => void run(), 250);
    return () => { canceled = true; clearTimeout(t); };
  }, [busqueda, onSearchProductsPage]);

  // Barcode
  useEffect(() => {
    if (!barcodeInput.trim() || barcodeInput.length < 5) return;
    const t = setTimeout(async () => {
      let product = products.find((p) => p.barcode?.trim().replace(/\s+/g, "") === barcodeInput.trim());
      if (!product && onLookupProductByBarcode) {
        try { product = await onLookupProductByBarcode(barcodeInput); } catch { /* noop */ }
      }
      if (!product) {
        toast({ title: "No encontrado", description: barcodeInput, variant: "destructive", duration: 800 });
      } else {
        seleccionarProducto(product);
      }
      setBarcodeInput("");
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodeInput]);

  const productosFiltrados = useMemo(() => {
    const base = busqueda.trim() && onSearchProductsPage ? serverItems : products;
    const term = busqueda.trim().toLowerCase();
    if (!term) return base;
    return base.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }, [busqueda, onSearchProductsPage, serverItems, products]);

  const seleccionarProducto = (product: Product) => {
    setProdSel(product);
    setNuevoItem({ cantidad: "", precioUnitario: product.price.toString() });
    setModalAbierto(false);
    setBusqueda("");
  };

  const agregarItem = () => {
    if (!prodSel) return;
    const cantidad = parseFloat(nuevoItem.cantidad) || 0;
    const precioUnitario = parseFloat(nuevoItem.precioUnitario) || 0;
    if (cantidad <= 0 || precioUnitario <= 0) {
      toast({ title: "Error", description: "Cantidad y precio deben ser mayores a 0", variant: "destructive" });
      return;
    }
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), producto: prodSel, cantidad, precioUnitario, subtotal: cantidad * precioUnitario },
    ]);
    setProdSel(null);
    setNuevoItem({ cantidad: "", precioUnitario: "" });
    toast({ title: "Producto agregado", description: prodSel.name, duration: 1500 });
  };

  const eliminarItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const limpiar = () => {
    form.reset(defaultFormValues());
    setCliente(null);
    setItems([]);
    setProdSel(null);
    setNuevoItem({ cantidad: "", precioUnitario: "" });
    setIva(0);
    toast({ title: "Presupuesto limpiado", duration: 1500 });
  };

  const guardarPresupuesto = async () => {
    if (items.length === 0) {
      toast({ title: "Error", description: "Agrega al menos un producto", variant: "destructive" });
      return;
    }
    const ok = await form.trigger();
    if (!ok) {
      toast({ title: "Error", description: "Revisa los datos del presupuesto", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const values = form.getValues();
      const presupuesto = {
        numero: values.numero,
        fecha: values.fecha,
        clienteNombre: values.clienteNombre,
        clienteTelefono: values.clienteTelefono ?? "",
        observaciones: values.observaciones ?? "",
        items,
        subtotal,
        iva: ivaVal,
        total,
      };
      toast({ title: "Presupuesto guardado", description: `Presupuesto ${presupuesto.numero} registrado`, duration: 3000 });

      if (cliente && esAdmin(rol)) {
        const productos = items.map((i) => i.producto.name).slice(0, 3).join(", ");
        agregarSeguimiento
          .mutateAsync({
            clienteId: cliente.id,
            tipo: "nota",
            texto: `Presupuesto ${presupuesto.numero} por $${Math.round(total).toLocaleString("es-AR")}: ${productos}${items.length > 3 ? " y más" : ""}`,
            fechaProgramada: null,
          })
          .catch(() => {
            // Si no se pudo anotar en el CRM no se corta nada.
          });
      }
    } catch (error) {
      toast({ title: "Error al guardar el presupuesto", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  //  Render
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

          {/* Info del presupuesto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Información del Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3"
                          onClick={() => form.setValue("numero", genNumero(), { shouldValidate: true })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label>IVA (%)</Label>
                  <Select value={iva.toString()} onValueChange={(v) => setIva(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exento)</SelectItem>
                      <SelectItem value="10.5">10.5%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                      <SelectItem value="27">27%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Datos del Cliente <span className="text-sm font-normal text-muted-foreground">(opcional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClienteSelector value={cliente} onChange={elegirCliente} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clienteNombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre / Razón Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clienteTelefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas adicionales..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Agregar productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Agregar Productos a Presupuestar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prodSel ? (
            <div className="p-4 border rounded-lg bg-muted/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">{prodSel.name}</h4>
                  <p className="text-sm text-muted-foreground">Código: {prodSel.code}</p>
                  <Badge variant="outline" className="mt-1">{prodSel.category}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Stock disponible:</strong> {prodSel.quantity} unidades
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setProdSel(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Cantidad *</Label>
                  <Input type="text" inputMode="decimal" value={nuevoItem.cantidad}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0))
                        setNuevoItem((p) => ({ ...p, cantidad: v }));
                    }}
                    placeholder="0" />
                </div>
                <div>
                  <Label>Precio Unitario *</Label>
                  <Input type="text" inputMode="decimal" value={nuevoItem.precioUnitario}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0))
                        setNuevoItem((p) => ({ ...p, precioUnitario: v }));
                    }}
                    placeholder="0.00" />
                </div>
                <div className="flex items-end">
                  <Button onClick={agregarItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />Agregar
                  </Button>
                </div>
              </div>

              {nuevoItem.cantidad && nuevoItem.precioUnitario && (
                <div className="mt-4 p-3 bg-background rounded border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      ${((parseFloat(nuevoItem.cantidad)||0) * (parseFloat(nuevoItem.precioUnitario)||0)).toLocaleString()}
                    </span>
                  </div>
                  {(parseFloat(nuevoItem.cantidad)||0) > prodSel.quantity && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/40 rounded text-xs flex items-center gap-1 text-amber-700 dark:text-amber-400">
                      <Minus className="h-3 w-3" />
                      <span>Atención: supera el stock actual (no bloquea el presupuesto)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Selecciona un producto del inventario</p>
              <Button onClick={() => setModalAbierto(true)} variant="outline">
                <Search className="h-4 w-4 mr-2" />Buscar Producto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Productos en el Presupuesto ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center p-3 border rounded-lg bg-muted/40 gap-3">
                    {/* Info + botón eliminar mobile */}
                    <div className="flex items-start justify-between sm:flex-1 min-w-0">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{item.producto.name}</div>
                        <div className="text-sm text-muted-foreground">Código: {item.producto.code}</div>
                        <Badge variant="outline" className="text-xs mt-1">{item.producto.category}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => eliminarItem(item.id)} className="text-destructive hover:text-destructive sm:hidden flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Inputs + subtotal + eliminar desktop */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex flex-col gap-1 w-20 sm:w-24">
                        <Label className="text-xs">Cantidad</Label>
                        <Input className="h-8 text-sm" type="text" value={item.cantidad}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = parseFloat(v);
                            if (v === "") {
                              setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, cantidad: 0, subtotal: 0 } : i));
                              return;
                            }
                            if (isNaN(n) || n < 0) return;
                            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, cantidad: n, subtotal: n * i.precioUnitario } : i));
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-1 w-24 sm:w-28">
                        <Label className="text-xs">Precio Unit.</Label>
                        <Input className="h-8 text-sm" type="text" value={item.precioUnitario}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = parseFloat(v);
                            if (v === "") {
                              setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, precioUnitario: 0, subtotal: 0 } : i));
                              return;
                            }
                            if (isNaN(n) || n < 0) return;
                            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, precioUnitario: n, subtotal: i.cantidad * n } : i));
                          }}
                        />
                      </div>

                      <span className="font-bold min-w-[70px] text-right text-sm sm:text-base">${item.subtotal.toLocaleString()}</span>
                      <Button variant="outline" size="sm" onClick={() => eliminarItem(item.id)} className="text-destructive hover:text-destructive hidden sm:flex">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="bg-muted/40 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {iva > 0 && (
                  <div className="flex justify-between">
                    <span>IVA ({iva}%)</span>
                    <span>${ivaVal.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-blue-600">
                  <span>TOTAL PRESUPUESTADO</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
        <Button
          onClick={guardarPresupuesto}
          disabled={items.length === 0 || isGenerating}
          className="px-6 py-3"
          size="lg"
        >
          <FileText className="h-5 w-5 mr-2" />
          {isGenerating ? "Guardando..." : "Guardar Presupuesto"}
        </Button>
        <Button
          onClick={limpiar}
          variant="outline"
          className="px-6 py-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          size="lg"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Limpiar Presupuesto
        </Button>
      </div>

      {/* Modal selector */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar Producto del Inventario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, código o categoría..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
            </div>

            <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <label className="text-sm font-semibold">O escanea código de barras:</label>
              </div>
              <Input autoFocus placeholder="Escanea aquí..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} className="bg-background border-primary/30 focus-visible:ring-primary" />
              <div className="text-xs text-muted-foreground mt-2">Listo para escanear</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {productosFiltrados.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => seleccionarProducto(product)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">Código: {product.code}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Precio:</span>
                      <p className="font-medium">${product.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stock:</span>
                      <p className={`font-medium ${product.quantity > 0 ? "text-[hsl(var(--income))]" : "text-amber-600 dark:text-amber-400"}`}>
                        {product.quantity} unidades
                      </p>
                    </div>
                  </div>
                  {product.quantity === 0 && (
                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Atención: sin stock actual (puede presupuestar igual)</div>
                  )}
                </div>
              ))}
            </div>

            {productosFiltrados.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
