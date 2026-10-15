
import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Package,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/shared/types/inventory"
import type { ProductoCompra } from "@/mocks/compras-proveedor"

const titleWithIcon = (Icon: LucideIcon, text: string) => (
  <span className="flex items-center gap-2">
    <Icon className="h-4 w-4" />
    {text}
  </span>
)
import { ProductFormForPurchase } from "./ProductFormParaCompra"
import type { FacturaCompra, FacturaCompraItem } from "./FacturaCompraForm/types"
import { InformacionFacturaCard } from "./FacturaCompraForm/InformacionFacturaCard"
import { DatosProveedorCard } from "./FacturaCompraForm/DatosProveedorCard"
import { AgregarProductosCard } from "./FacturaCompraForm/AgregarProductosCard"
import { ItemsListCard } from "./FacturaCompraForm/ItemsListCard"
import { SelectorProductoModal } from "./FacturaCompraForm/SelectorProductoModal"
import { VistaPreviaModal } from "./FacturaCompraForm/VistaPreviaModal"
import {
  facturaCompraSchema,
  type FacturaCompraFormValues,
} from "../schemas/factura-compra.schema"

interface Props {
  products?: Product[]
  proveedores?: import("@/shared/types/inventory").Proveedor[]
  onUpdateProductCost: (productId: string, newCost: number) => Promise<void>
  onUpdateProductPrice: (productId: string, newPrice: number) => Promise<void>
  onAddMovement: (productId: string, quantity: number, reason: string) => Promise<void>
  onCreateProduct: (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<Product>
  onRegistrarCompraProveedor?: (proveedorId: string, productos: ProductoCompra[], concepto?: string) => Promise<void>
}

// Generar número de factura
const generarNumeroFactura = () => {
  const fecha = new Date()
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")
  const dia = String(fecha.getDate()).padStart(2, "0")
  const hora = String(fecha.getHours()).padStart(2, "0")
  const minuto = String(fecha.getMinutes()).padStart(2, "0")
  const segundo = String(fecha.getSeconds()).padStart(2, "0")

  return `COMP-${año}${mes}${dia}-${hora}${minuto}${segundo}`
}

const defaultFormValues = (): FacturaCompraFormValues => ({
  numero: generarNumeroFactura(),
  fecha: new Date().toISOString().split("T")[0],
  proveedorNombre: "",
  proveedorCuit: "",
  proveedorDireccion: "",
  proveedorTelefono: "",
  proveedorEmail: "",
  observaciones: "",
  iva: 21,
})

export default function FacturaCompraForm({
  products = [],
  proveedores = [],
  onUpdateProductCost,
  onUpdateProductPrice,
  onAddMovement,
  onCreateProduct,
  onRegistrarCompraProveedor,
}: Props) {
  const { toast } = useToast()

  const form = useForm<FacturaCompraFormValues>({
    resolver: zodResolver(facturaCompraSchema),
    defaultValues: defaultFormValues(),
    mode: "onBlur",
  })

  // Items y estado de selección de producto (no son parte del form RHF)
  const [items, setItems] = useState<FacturaCompraItem[]>([])
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null)
  const [nuevoItem, setNuevoItem] = useState({
    cantidad: "",
    costoUnitario: "",
    precioVentaUnitario: "",
  })

  // Flags de modales
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)
  const [mostrarSelectorProducto, setMostrarSelectorProducto] = useState(false)
  const [mostrarCrearProducto, setMostrarCrearProducto] = useState(false)

  // Búsqueda de productos
  const [busquedaProducto, setBusquedaProducto] = useState("")

  // Factura ya procesada para mostrar en la vista previa
  const [facturaProcesada, setFacturaProcesada] = useState<FacturaCompra | null>(null)

  // Valor IVA del form (para reactividad)
  const porcentajeIva = form.watch("iva") ?? 0

  // Filtrar productos por búsqueda - CON PROTECCIÓN
  const productosFiltrados = (products || []).filter(
    (product) =>
      product?.name?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      product?.code?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      product?.category?.toLowerCase().includes(busquedaProducto.toLowerCase()),
  )

  // Función para generar nuevo número
  const generarNuevoNumero = () => {
    const numeroGenerado = generarNumeroFactura()
    form.setValue("numero", numeroGenerado, { shouldValidate: true })
    toast({
      title: titleWithIcon(RefreshCw, "Número generado"),
      description: `Nuevo número: ${numeroGenerado}`,
      duration: 2000,
    })
  }

  // Totales derivados de items + iva
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items],
  )
  const ivaCalculado = useMemo(
    () => (subtotal * porcentajeIva) / 100,
    [subtotal, porcentajeIva],
  )
  const total = useMemo(() => subtotal + ivaCalculado, [subtotal, ivaCalculado])

  // Construir el objeto FacturaCompra completo (para sub-componentes que lo necesitan)
  const buildFacturaActual = (): FacturaCompra => {
    const values = form.getValues()
    return {
      id: "",
      numero: values.numero,
      fecha: values.fecha,
      proveedor: {
        nombre: values.proveedorNombre,
        cuit: values.proveedorCuit ?? "",
        direccion: values.proveedorDireccion ?? "",
        telefono: values.proveedorTelefono ?? "",
        email: values.proveedorEmail ?? "",
      },
      items,
      subtotal,
      iva: ivaCalculado,
      total,
      observaciones: values.observaciones ?? "",
    }
  }

  // Watch sólo los campos que ItemsListCard / VistaPrevia consumen para que se re-renderice
  const watchedNumero = form.watch("numero")
  const watchedFecha = form.watch("fecha")
  const watchedProvNombre = form.watch("proveedorNombre")
  const watchedProvCuit = form.watch("proveedorCuit")
  const watchedProvDireccion = form.watch("proveedorDireccion")
  const watchedProvTelefono = form.watch("proveedorTelefono")
  const watchedProvEmail = form.watch("proveedorEmail")
  const watchedObservaciones = form.watch("observaciones")

  const facturaActual: FacturaCompra = useMemo(
    () => ({
      id: "",
      numero: watchedNumero,
      fecha: watchedFecha,
      proveedor: {
        nombre: watchedProvNombre,
        cuit: watchedProvCuit ?? "",
        direccion: watchedProvDireccion ?? "",
        telefono: watchedProvTelefono ?? "",
        email: watchedProvEmail ?? "",
      },
      items,
      subtotal,
      iva: ivaCalculado,
      total,
      observaciones: watchedObservaciones ?? "",
    }),
    [
      watchedNumero,
      watchedFecha,
      watchedProvNombre,
      watchedProvCuit,
      watchedProvDireccion,
      watchedProvTelefono,
      watchedProvEmail,
      watchedObservaciones,
      items,
      subtotal,
      ivaCalculado,
      total,
    ],
  )

  // Manejar cambios en campos numéricos
  const handleNumericChange = (
    value: string,
    field: "cantidad" | "costoUnitario" | "precioVentaUnitario",
  ) => {
    if (value === "") {
      setNuevoItem((prev) => ({ ...prev, [field]: "" }))
      return
    }

    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setNuevoItem((prev) => ({ ...prev, [field]: value }))
    }
  }

  // Crear producto rápido desde la factura
  const handleCrearProducto = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const nuevoProducto = await onCreateProduct(productData)
      setProductoSeleccionado(nuevoProducto)
      setNuevoItem({
        cantidad: "",
        costoUnitario: nuevoProducto.cost.toString(),
        precioVentaUnitario: nuevoProducto.price.toString(),
      })
      setMostrarCrearProducto(false)
      setMostrarSelectorProducto(false)
      setBusquedaProducto("")

      toast({
        title: titleWithIcon(CheckCircle2, "Producto creado y seleccionado"),
        description: `${nuevoProducto.name} se creó correctamente y está listo para la factura`,
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: titleWithIcon(XCircle, "Error al crear producto"),
        description: "No se pudo crear el producto",
        variant: "destructive",
      })
    }
  }

  // Seleccionar producto del modal
  const seleccionarProducto = (product: Product) => {
    setProductoSeleccionado(product)
    setNuevoItem({
      cantidad: "",
      costoUnitario: product.cost.toString(),
      precioVentaUnitario: product.price.toString(),
    })
    setMostrarSelectorProducto(false)
    setBusquedaProducto("")

    toast({
      title: titleWithIcon(CheckCircle2, "Producto seleccionado"),
      description: `${product.name} agregado para compra`,
      duration: 2000,
    })
  }

  // Agregar item a la factura
  const agregarItem = () => {
    if (!productoSeleccionado) {
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description: "Selecciona un producto primero",
        variant: "destructive",
      })
      return
    }

    const cantidad = parseFloat(nuevoItem.cantidad) || 0
    const costoUnitario = parseFloat(nuevoItem.costoUnitario) || 0
    const precioVentaUnitario = parseFloat(nuevoItem.precioVentaUnitario) || 0

    if (cantidad <= 0 || costoUnitario <= 0 || precioVentaUnitario <= 0) {
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description: "La cantidad, costo y precio de venta deben ser mayores a 0",
        variant: "destructive",
      })
      return
    }

    const item: FacturaCompraItem = {
      id: Date.now().toString(),
      producto: productoSeleccionado,
      cantidad: cantidad,
      costoUnitario: costoUnitario,
      precioVentaUnitario: precioVentaUnitario,
      subtotal: cantidad * costoUnitario,
    }

    setItems((prev) => [...prev, item])

    // Limpiar selección
    setProductoSeleccionado(null)
    setNuevoItem({
      cantidad: "",
      costoUnitario: "",
      precioVentaUnitario: "",
    })

    toast({
      title: titleWithIcon(CheckCircle2, "Producto agregado"),
      description: `${item.producto.name} agregado a la factura de compra`,
      duration: 2000,
    })
  }

  // Eliminar item
  const eliminarItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))

    toast({
      title: titleWithIcon(Trash2, "Producto eliminado"),
      description: "El producto fue removido de la factura",
      duration: 2000,
    })
  }

  const procesarFacturaCompra = async () => {
    // Validar el form (RHF + Zod) - los errores se muestran inline
    const ok = await form.trigger()
    if (!ok) return

    if (items.length === 0) {
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description: "Agrega al menos un producto a la factura",
        variant: "destructive",
      })
      return
    }

    try {
      // Actualizar costos, precios y registrar movimientos de entrada
      const factura = buildFacturaActual()
      for (const item of items) {
        await onUpdateProductCost(item.producto.id, item.costoUnitario)
        await onUpdateProductPrice(item.producto.id, item.precioVentaUnitario)
        await onAddMovement(
          item.producto.id,
          item.cantidad,
          `Compra - Factura ${factura.numero} - Proveedor: ${factura.proveedor.nombre}`,
        )
      }

      if (selectedProveedorId && onRegistrarCompraProveedor) {
        const productosCompra: ProductoCompra[] = items.map((item) => ({
          producto_id: item.producto.id,
          nombre: item.producto.name,
          cantidad: item.cantidad,
          precio_unitario: item.costoUnitario,
        }))
        await onRegistrarCompraProveedor(
          selectedProveedorId,
          productosCompra,
          `Factura ${factura.numero}`,
        )
      }

      const facturaFinal: FacturaCompra = {
        ...factura,
        id: Date.now().toString(),
      }

      setFacturaProcesada(facturaFinal)
      setMostrarVistaPrevia(true)

      toast({
        title: titleWithIcon(Package, "Factura de compra procesada"),
        description: `Factura ${facturaFinal.numero} registrada, stock agregado y precios actualizados`,
        duration: 4000,
      })
    } catch (error) {
      toast({
        title: titleWithIcon(XCircle, "Error al procesar"),
        description: "No se pudieron actualizar los datos del producto",
        variant: "destructive",
      })
    }
  }

  // Mostrar mensaje si no hay productos
  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay productos disponibles</h3>
            <p className="text-muted-foreground text-center">
              Primero agrega productos a tu inventario para poder crear facturas de compra.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void procesarFacturaCompra()
          }}
          className="space-y-6"
        >
          {/* Información básica */}
          <InformacionFacturaCard
            control={form.control}
            generarNuevoNumero={generarNuevoNumero}
          />

          {/* Datos del proveedor */}
          <DatosProveedorCard control={form.control} setValue={form.setValue} proveedores={proveedores} onProveedorSelected={setSelectedProveedorId} />

          {/* Agregar productos */}
          <AgregarProductosCard
            productoSeleccionado={productoSeleccionado}
            setProductoSeleccionado={setProductoSeleccionado}
            nuevoItem={nuevoItem}
            handleNumericChange={handleNumericChange}
            agregarItem={agregarItem}
            setMostrarSelectorProducto={setMostrarSelectorProducto}
          />

          {/* Lista de productos agregados */}
          {items.length > 0 && (
            <ItemsListCard
              facturaActual={facturaActual}
              porcentajeIva={porcentajeIva}
              eliminarItem={eliminarItem}
            />
          )}

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones adicionales sobre la compra (opcional)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botón para procesar */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={items.length === 0}
              className="bg-green-600 hover:bg-green-700 px-8 py-3"
              size="lg"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Procesar Factura de Compra
            </Button>
          </div>
        </form>
      </Form>

      {/* Modal selector de productos */}
      <SelectorProductoModal
        mostrarSelectorProducto={mostrarSelectorProducto}
        setMostrarSelectorProducto={setMostrarSelectorProducto}
        setMostrarCrearProducto={setMostrarCrearProducto}
        busquedaProducto={busquedaProducto}
        setBusquedaProducto={setBusquedaProducto}
        productosFiltrados={productosFiltrados}
        seleccionarProducto={seleccionarProducto}
      />

      {/* Modal: crear producto rápido */}
      <Dialog open={mostrarCrearProducto} onOpenChange={setMostrarCrearProducto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-600">Crear Nuevo Producto</DialogTitle>
          </DialogHeader>
          <ProductFormForPurchase
            onSubmit={handleCrearProducto}
            initialData={{
              name: busquedaProducto || "",
            }}
            onCancel={() => setMostrarCrearProducto(false)}
            existingCodes={products.map((p) => p.code)}
            products={products}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de vista previa */}
      <VistaPreviaModal
        mostrarVistaPrevia={mostrarVistaPrevia}
        setMostrarVistaPrevia={setMostrarVistaPrevia}
        facturaActual={facturaProcesada ?? facturaActual}
        porcentajeIva={porcentajeIva}
      />
    </div>
  )
}
