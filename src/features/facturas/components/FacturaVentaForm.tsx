

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  ClienteVenta,
  MetodoPago,
  Product,
} from "@/shared/types/inventory";
import {
  FACTOR_METODO_PAGO,
  METODO_PAGO_LABELS,
} from "@/shared/types/inventory";

const titleWithIcon = (Icon: LucideIcon, text: string) => (
  <span className="flex items-center gap-2">
    <Icon className="h-4 w-4" />
    {text}
  </span>
);

import type {
  FacturaVenta,
  FacturaVentaItem,
  NuevoItemState,
} from "./FacturaVentaForm/types";
import { InformacionFacturaCard } from "./FacturaVentaForm/InformacionFacturaCard";
import { DatosClienteCard } from "./FacturaVentaForm/DatosClienteCard";
import { AgregarProductosCard } from "./FacturaVentaForm/AgregarProductosCard";
import { ItemsListCard } from "./FacturaVentaForm/ItemsListCard";
import { SelectorProductoModal } from "./FacturaVentaForm/SelectorProductoModal";
import { AccionesFactura } from "./FacturaVentaForm/AccionesFactura";
import {
  facturaVentaSchema,
  type FacturaVentaFormValues,
} from "../schemas/factura-venta.schema";
import { insertarBoletaPendiente } from "@/mocks/boletas";

interface Props {
  products?: Product[];
  clientes?: ClienteVenta[];
  onLookupProductByBarcode?: (barcode: string) => Promise<Product | undefined>;
  onSearchProductsPage?: (
    query: string,
    limit: number,
    offset: number,
    excludeOutOfStock: boolean
  ) => Promise<{ items: Product[]; hasMore: boolean }>;
  onSaleProduct: (
    productId: string,
    quantity: number,
    reason: string,
    precioVendido?: number,
    metodoPago?: MetodoPago
  ) => Promise<void>;
  onAddVentaFiado?: (
    clienteId: number,
    productos: any[]
  ) => Promise<{ success: boolean; ventaId: any; total: number }>;
  addCliente: (
    nombre: string,
    cuit: string,
    telefono: string
  ) => Promise<ClienteVenta | undefined>;

  currentUser?: {
    id?: string | number;
    username: string;
    rol: string;
  } | null;
  enviarBoletaPendiente?: () => Promise<void>;
}

// Generar número de factura
const generarNumeroFactura = () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minuto = String(fecha.getMinutes()).padStart(2, "0");
  const segundo = String(fecha.getSeconds()).padStart(2, "0");

  return `VENTA-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
};

const defaultFormValues = (): FacturaVentaFormValues => ({
  numero: generarNumeroFactura(),
  fecha: new Date().toISOString().split("T")[0],
  clienteNombre: "",
  clienteCuit: "",
  clienteDireccion: "",
  clienteTelefono: "",
  clienteEmail: "",
  observaciones: "",
  iva: 0,
});

export default function FacturaVentaForm({
  products = [],
  clientes = [],
  onLookupProductByBarcode,
  onSearchProductsPage,
  onAddVentaFiado,
  onSaleProduct,
  addCliente,
  currentUser,
  enviarBoletaPendiente,
}: Props) {
  const { toast } = useToast();

  const form = useForm<FacturaVentaFormValues>({
    resolver: zodResolver(facturaVentaSchema),
    defaultValues: defaultFormValues(),
    mode: "onBlur",
  });

  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [searchClienteTerm, setSearchClienteTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBarcodeTimeRef = useRef<number>(0);
  const [isFacturaLoading, setIsFacturaLoading] = useState(false);

  // Items y estado de selección de producto (no son parte del form RHF)
  const [items, setItems] = useState<FacturaVentaItem[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Product | null>(null);
  const [nuevoItem, setNuevoItem] = useState<NuevoItemState>({
    cantidad: "",
    precioUnitario: "",
  });

  const [mostrarSelectorProducto, setMostrarSelectorProducto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [serverSearchItems, setServerSearchItems] = useState<Product[]>([]);
  const [serverSearchLoading, setServerSearchLoading] = useState(false);

  const getEffectiveSalePrice = (product: Product) => {
    return Math.round(Number(product.price ?? 0));
  };

  const rol = currentUser?.rol;
  const isVendedor = rol === "vendedor";
  const isCaja = rol === "caja";

  const filteredClientes = useMemo(() => {
    if (!searchClienteTerm) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
        c.cuit?.includes(searchClienteTerm)
    );
  }, [clientes, searchClienteTerm]);

  const agregarProductoDelModal = (product: Product) => {
    if (product.quantity <= 0) {
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description: "Sin stock disponible",
        variant: "destructive",
      });
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        producto: product,
        cantidad: 1,
        precioUnitario: getEffectiveSalePrice(product),
        subtotal: getEffectiveSalePrice(product),
      },
    ]);

    toast({
      title: titleWithIcon(CheckCircle2, "Producto agregado"),
      description: product.name,
      duration: 1000,
    });

    // ⬅️ NO cierra el modal
  };

  const validateBarcode = (barcode: string): boolean => {
    const cleaned = barcode.trim().replace(/\s+/g, "");

    if (!cleaned) return false;
    if (!/^\d{5,}$/.test(cleaned)) return false;
    if (cleaned.length < 5 || cleaned.length > 128) return false;

    return true;
  };

  const findProductByBarcode = (barcode: string): Product | undefined => {
    const cleaned = barcode.trim().replace(/\s+/g, "");

    console.log(`🔍 Buscando barcode: ${cleaned}`);

    const product = products.find((p) => {
      const productBarcode = p.barcode
        ? p.barcode.trim().replace(/\s+/g, "")
        : "";
      return productBarcode === cleaned;
    });

    if (!product) {
      console.log("❌ No encontrado. Barcodes disponibles:");
      products.forEach((p) => {
        if (p.barcode) console.log(`   - ${p.name}: ${p.barcode}`);
      });
    }

    return product;
  };

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let canceled = false;

    const run = async () => {
      const term = (busquedaProducto || "").trim();
      if (!term) {
        setServerSearchItems([]);
        setServerSearchLoading(false);
        return;
      }
      if (!onSearchProductsPage) return;

      setServerSearchLoading(true);
      try {
        const res = await onSearchProductsPage(term, 200, 0, true);
        if (canceled) return;
        setServerSearchItems(res.items);
      } catch (e) {
        if (canceled) return;
        setServerSearchItems([]);
      } finally {
        if (canceled) return;
        setServerSearchLoading(false);
      }
    };

    const t = setTimeout(() => {
      void run();
    }, 250);

    return () => {
      canceled = true;
      clearTimeout(t);
    };
  }, [busquedaProducto, onSearchProductsPage]);

  // ✅ Filtrar productos por búsqueda - CON PROTECCIÓN
  const productosFiltrados = (
    (busquedaProducto || "").trim() && onSearchProductsPage
      ? serverSearchItems
      : products || []
  ).filter((product) => {
    if (!product) return false;
    if ((product.quantity ?? 0) <= 0) return false;

    const term = (busquedaProducto || "").trim().toLowerCase();
    if (!term) return true;

    return (
      (product.name || "").toLowerCase().includes(term) ||
      (product.code || "").toLowerCase().includes(term) ||
      (product.category || "").toLowerCase().includes(term)
    );
  });

  // Función para generar nuevo número
  const generarNuevoNumero = () => {
    const numeroGenerado = generarNumeroFactura();
    form.setValue("numero", numeroGenerado, { shouldValidate: true });
    toast({
      title: titleWithIcon(RefreshCw, "Número generado"),
      description: `Nuevo número: ${numeroGenerado}`,
      duration: 2000,
    });
  };

  // ✅ USEEFFECT PARA PROCESAR BARCODE CON DEBOUNCE
  useEffect(() => {
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current);
    }

    if (!barcodeInput.trim() || barcodeInput.length < 5) {
      return;
    }

    const now = Date.now();
    const timeSinceLastScan = now - lastBarcodeTimeRef.current;
    const delay = timeSinceLastScan < 100 ? 150 : 100;

    barcodeTimeoutRef.current = setTimeout(() => {
      const run = async () => {
        if (!validateBarcode(barcodeInput)) {
          toast({
            title: titleWithIcon(AlertTriangle, "Código inválido"),
            description: `"${barcodeInput}" no es válido`,
            variant: "destructive",
            duration: 800,
          });
          setBarcodeInput("");
          lastBarcodeTimeRef.current = Date.now();
          return;
        }

        let product = findProductByBarcode(barcodeInput);

        if (!product && onLookupProductByBarcode) {
          try {
            product = await onLookupProductByBarcode(barcodeInput);
          } catch (e) {
            console.error("❌ Error buscando producto por barcode:", e);
          }
        }

        if (!product) {
          toast({
            title: titleWithIcon(XCircle, "No encontrado"),
            description: `${barcodeInput}`,
            variant: "destructive",
            duration: 800,
          });
          setBarcodeInput("");
          lastBarcodeTimeRef.current = Date.now();
          return;
        }

        if (product.quantity <= 0) {
          toast({
            title: titleWithIcon(XCircle, "Sin stock"),
            description: product.name,
            variant: "destructive",
            duration: 800,
          });
          setBarcodeInput("");
          lastBarcodeTimeRef.current = Date.now();
          return;
        }

        // ✅ Agregar producto al carrito
        agregarProductoDelModal(product);

        setBarcodeInput("");
        lastBarcodeTimeRef.current = Date.now();
      };

      void run();
    }, delay);
  }, [barcodeInput, products, toast, onLookupProductByBarcode]);

  // ✅ LIMPIAR TIMEOUT AL DESMONTAR
  useEffect(() => {
    return () => {
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, []);

  // Valor IVA del form (para reactividad)
  const porcentajeIva = form.watch("iva") ?? 0;

  // Totales derivados de items + iva
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );
  const ivaCalculado = useMemo(
    () => (subtotal * porcentajeIva) / 100,
    [subtotal, porcentajeIva]
  );
  const total = useMemo(() => subtotal + ivaCalculado, [subtotal, ivaCalculado]);

  // Watch sólo los campos que sub-componentes consumen para que se re-renderice
  const watchedNumero = form.watch("numero");
  const watchedFecha = form.watch("fecha");
  const watchedClienteNombre = form.watch("clienteNombre");
  const watchedClienteCuit = form.watch("clienteCuit");
  const watchedClienteDireccion = form.watch("clienteDireccion");
  const watchedClienteTelefono = form.watch("clienteTelefono");
  const watchedClienteEmail = form.watch("clienteEmail");
  const watchedObservaciones = form.watch("observaciones");

  // Construir el objeto FacturaVenta completo (para sub-componentes que lo necesitan)
  const facturaActual: FacturaVenta = useMemo(
    () => ({
      id: "",
      numero: watchedNumero,
      fecha: watchedFecha,
      cliente: {
        nombre: watchedClienteNombre ?? "",
        cuit: watchedClienteCuit ?? "",
        direccion: watchedClienteDireccion ?? "",
        telefono: watchedClienteTelefono ?? "",
        email: watchedClienteEmail ?? "",
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
      watchedClienteNombre,
      watchedClienteCuit,
      watchedClienteDireccion,
      watchedClienteTelefono,
      watchedClienteEmail,
      watchedObservaciones,
      items,
      subtotal,
      ivaCalculado,
      total,
    ]
  );

  const buildFacturaActual = (): FacturaVenta => {
    const values = form.getValues();
    return {
      id: "",
      numero: values.numero,
      fecha: values.fecha,
      cliente: {
        nombre: values.clienteNombre ?? "",
        cuit: values.clienteCuit ?? "",
        direccion: values.clienteDireccion ?? "",
        telefono: values.clienteTelefono ?? "",
        email: values.clienteEmail ?? "",
      },
      items,
      subtotal,
      iva: ivaCalculado,
      total,
      observaciones: values.observaciones ?? "",
    };
  };

  // Manejar cambios en campos numéricos
  const handleNumericChange = (
    value: string,
    field: "cantidad" | "precioUnitario"
  ) => {
    if (value === "") {
      setNuevoItem((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setNuevoItem((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Seleccionar producto del modal
  const seleccionarProducto = (product: Product) => {
    setProductoSeleccionado(product);
    setNuevoItem({
      cantidad: "",
      precioUnitario: product.price.toString(),
    });
    setMostrarSelectorProducto(false);
    setBusquedaProducto("");

    toast({
      title: titleWithIcon(CheckCircle2, "Producto seleccionado"),
      description: `${product.name} agregado para venta`,
      duration: 2000,
    });
  };

  // Agregar item a la factura
  const agregarItem = () => {
    if (!productoSeleccionado) {
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description: "Selecciona un producto primero",
        variant: "destructive",
      });
      return;
    }

    const cantidad = parseFloat(nuevoItem.cantidad) || 0;
    const precioUnitario = parseFloat(nuevoItem.precioUnitario) || 0;

    if (cantidad <= 0 || precioUnitario <= 0) {
      toast({
        title: titleWithIcon(XCircle, "Error"),
        description: "La cantidad y el precio deben ser mayores a 0",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDAR STOCK DISPONIBLE
    if (cantidad > productoSeleccionado.quantity) {
      toast({
        title: titleWithIcon(XCircle, "Stock insuficiente"),
        description: `Solo hay ${productoSeleccionado.quantity} unidades disponibles`,
        variant: "destructive",
      });
      return;
    }

    const item: FacturaVentaItem = {
      id: Date.now().toString(),
      producto: productoSeleccionado,
      cantidad: cantidad,
      precioUnitario: precioUnitario,
      subtotal: cantidad * precioUnitario,
    };

    setItems((prev) => [...prev, item]);

    // Limpiar selección
    setProductoSeleccionado(null);
    setNuevoItem({
      cantidad: "",
      precioUnitario: "",
    });

    toast({
      title: titleWithIcon(CheckCircle2, "Producto agregado"),
      description: `${item.producto.name} agregado a la factura de venta`,
      duration: 2000,
    });
  };

  // Eliminar item
  const eliminarItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));

    toast({
      title: titleWithIcon(Trash2, "Producto eliminado"),
      description: "El producto fue removido de la factura",
      duration: 2000,
    });
  };

  // Porcentajes derivados de los factores compartidos, para los carteles.
  const DISCOUNT_PERCENT_CASH = Math.round(
    (1 - FACTOR_METODO_PAGO.debito) * 100
  );
  const SURCHARGE_PERCENT_CARD = Math.round(
    (FACTOR_METODO_PAGO.tarjeta - 1) * 100
  );

  const totalLista = Number(facturaActual.total || 0) || 0;

  const totalConDebitoEfectivo = useMemo(
    () => totalLista * FACTOR_METODO_PAGO.debito,
    [totalLista]
  );
  const totalConTarjeta = useMemo(
    () => totalLista * FACTOR_METODO_PAGO.tarjeta,
    [totalLista]
  );

  // Resetea form + items + búsqueda y demás auxiliares al estado inicial.
  const resetFacturaState = () => {
    form.reset({
      ...defaultFormValues(),
      numero: generarNumeroFactura(),
    });
    setItems([]);
    setSearchClienteTerm("");
    setProductoSeleccionado(null);
    setNuevoItem({ cantidad: "", precioUnitario: "" });
    setMostrarSelectorProducto(false);
  };

  const enviarBoletaPendienteHandler = async () => {
    // Validar campos del form (numero, fecha, iva, email)
    const ok = await form.trigger();
    if (!ok) {
      toast({
        title: "Error",
        description: "Revisá los datos de la factura",
        variant: "destructive",
      });
      return;
    }

    const factura = buildFacturaActual();

    // Validar nombre del cliente (no validado por Zod porque es opcional global)
    if (!factura.cliente.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (factura.items.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un producto",
        variant: "destructive",
      });
      return;
    }

    try {
      const ventaConProductoId = {
        ...factura,
        items: factura.items.map((item) => ({
          producto_id: item.producto.id,
          nombre: item.producto.name,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
      };

      // Si el cliente ya existe (mismo CUIT o nombre), la boleta queda ligada
      // a él y la compra aparece en su ficha del CRM.
      const clienteExistente = clientes.find(
        (c) =>
          (factura.cliente.cuit && c.cuit === factura.cliente.cuit) ||
          (!factura.cliente.cuit && c.nombre === factura.cliente.nombre.trim())
      );

      await insertarBoletaPendiente({
        venta: ventaConProductoId,
        vendedorId: currentUser?.id,
        vendedorNombre: currentUser?.username,
        clienteId: clienteExistente?.id ?? null,
      });

      toast({
        title: titleWithIcon(CheckCircle2, "Boleta enviada"),
        description: "Se guardó correctamente en pendientes",
        duration: 2000,
      });

      resetFacturaState();
    } catch (error) {
      console.error("Error enviando boleta:", error);

      toast({
        title: titleWithIcon(XCircle, "Error"),
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const procesarFacturaVenta = async (metodo: MetodoPago) => {
    // Validar el form (RHF + Zod) - los errores se muestran inline
    const ok = await form.trigger();
    if (!ok) {
      toast({
        title: "Error",
        description: "Revisá los datos de la factura",
        variant: "destructive",
      });
      return;
    }

    setIsFacturaLoading(true);

    try {
      const factura = buildFacturaActual();

      // Validar cliente
      if (!factura.cliente.nombre.trim()) {
        toast({
          title: "Error",
          description: "El nombre del cliente es obligatorio",
          variant: "destructive",
        });
        return;
      }

      // Validar items
      if (factura.items.length === 0) {
        toast({
          title: "Error",
          description: "Agrega al menos un producto a la factura",
          variant: "destructive",
        });
        return;
      }

      // Buscar cliente existente por CUIT o NOMBRE
      let clienteEnBD = clientes.find(
        (c) =>
          (factura.cliente.cuit && c.cuit === factura.cliente.cuit) ||
          (!factura.cliente.cuit && c.nombre === factura.cliente.nombre)
      );

      // Crear cliente nuevo si no existe
      if (!clienteEnBD) {
        clienteEnBD = await addCliente(
          factura.cliente.nombre,
          factura.cliente.cuit || "",
          factura.cliente.telefono || ""
        );

        if (!clienteEnBD || !clienteEnBD.id) {
          toast({
            title: "Error",
            description: "No se pudo guardar el cliente",
            variant: "destructive",
          });
          return;
        }
      }

      const factor = FACTOR_METODO_PAGO[metodo];
      // "credito" (precio de lista) no lleva sufijo: el motivo queda igual
      // que siempre, asi los movimientos viejos y los nuevos se leen igual.
      const sufijoMotivo =
        metodo === "debito"
          ? ` (${METODO_PAGO_LABELS.debito} -${DISCOUNT_PERCENT_CASH}%)`
          : metodo === "tarjeta"
          ? ` (${METODO_PAGO_LABELS.tarjeta} +${SURCHARGE_PERCENT_CARD}%)`
          : "";
      const itemsProcesados: FacturaVentaItem[] = factura.items.map((item) => {
        const unit = item.precioUnitario * factor;
        return {
          ...item,
          precioUnitario: unit,
          subtotal: unit * item.cantidad,
        };
      });

      const subtotalProcesado = itemsProcesados.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      const ivaProcesado = (subtotalProcesado * porcentajeIva) / 100;
      const totalProcesado = subtotalProcesado + ivaProcesado;

      const facturaParaGuardar: FacturaVenta = {
        ...factura,
        id: factura.id || Date.now().toString(),
        items: itemsProcesados,
        subtotal: subtotalProcesado,
        iva: ivaProcesado,
        total: totalProcesado,
      };

      // Procesar ventas
      for (const item of facturaParaGuardar.items) {
        await onSaleProduct(
          item.producto.id,
          item.cantidad,
          `Venta - Factura ${facturaParaGuardar.numero}${sufijoMotivo}`,
          item.precioUnitario,
          metodo
        );
      }

      toast({
        title: "Factura de venta procesada",
        description: `Factura ${facturaParaGuardar.numero} registrada`,
        duration: 3000,
      });

      // Limpiar formulario
      resetFacturaState();
    } catch (error) {
      console.error("Error al procesar la factura", error);
      toast({
        title: "Error al procesar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo procesar la venta",
        variant: "destructive",
      });
    } finally {
      setIsFacturaLoading(false);
    }
  };

  const procesarFacturaVentaDebito = async () => {
    await procesarFacturaVenta("debito");
  };

  // "Credito" es el precio de lista sin ajuste (factor 1).
  const procesarFacturaVentaCredito = async () => {
    await procesarFacturaVenta("credito");
  };

  const procesarFacturaVentaTarjeta = async () => {
    await procesarFacturaVenta("tarjeta");
  };

  const handleDejarAFiado = async () => {
    // Validar el form (RHF + Zod)
    const ok = await form.trigger();
    if (!ok) {
      toast({
        title: "Error",
        description: "Revisá los datos de la factura",
        variant: "destructive",
      });
      return;
    }

    const factura = buildFacturaActual();

    if (!factura.cliente.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (factura.items.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un producto",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // ✅ CORRECCIÓN: Buscar por CUIT o NOMBRE
      let clienteEnBD = clientes.find(
        (c) =>
          (factura.cliente.cuit && c.cuit === factura.cliente.cuit) ||
          (!factura.cliente.cuit && c.nombre === factura.cliente.nombre)
      );

      if (!clienteEnBD) {
        clienteEnBD = await addCliente(
          factura.cliente.nombre,
          factura.cliente.cuit || "",
          factura.cliente.telefono || ""
        );

        if (!clienteEnBD || !clienteEnBD.id) {
          toast({
            title: "Error",
            description: "No se pudo guardar el cliente",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const productosVenta = factura.items.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
      }));

      if (!onAddVentaFiado) {
        toast({
          title: "Error",
          description: "Función de venta no disponible",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const resultado = await onAddVentaFiado(clienteEnBD.id, productosVenta);

      toast({
        title: "Venta a cuenta corriente registrada",
        description: `$${factura.total.toLocaleString()} dejada a cuenta para ${
          clienteEnBD.nombre
        }`,
        duration: 3000,
      });

      resetFacturaState();
    } catch (error) {
      console.error("Error en venta fiado:", error);
      toast({
        title: "Error al procesar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la venta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No hay productos disponibles
            </h3>
            <p className="text-muted-foreground text-center">
              Primero agrega productos a tu inventario para poder crear facturas
              de venta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            // Las acciones se manejan via botones específicos. Evitamos submit por Enter accidental.
            e.preventDefault();
          }}
          className="space-y-6"
        >
          {/* Información básica */}
          <InformacionFacturaCard
            control={form.control}
            generarNuevoNumero={generarNuevoNumero}
          />

          {/* Datos del cliente */}
          <DatosClienteCard
            control={form.control}
            setValue={form.setValue}
            searchClienteTerm={searchClienteTerm}
            setSearchClienteTerm={setSearchClienteTerm}
            showClienteDropdown={showClienteDropdown}
            setShowClienteDropdown={setShowClienteDropdown}
            filteredClientes={filteredClientes}
          />

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
          <ItemsListCard
            facturaActual={facturaActual}
            setItems={setItems}
            porcentajeIva={porcentajeIva}
            totalConDebitoEfectivo={totalConDebitoEfectivo}
            totalConTarjeta={totalConTarjeta}
            DISCOUNT_PERCENT_CASH={DISCOUNT_PERCENT_CASH}
            SURCHARGE_PERCENT_CARD={SURCHARGE_PERCENT_CARD}
            eliminarItem={eliminarItem}
            toast={toast}
          />

          {/* Botones de acción */}
          <AccionesFactura
            facturaActual={facturaActual}
            isVendedor={isVendedor}
            isFacturaLoading={isFacturaLoading}
            isLoading={isLoading}
            enviarBoletaPendienteHandler={enviarBoletaPendienteHandler}
            procesarFacturaVentaDebito={procesarFacturaVentaDebito}
            procesarFacturaVentaCredito={procesarFacturaVentaCredito}
            procesarFacturaVentaTarjeta={procesarFacturaVentaTarjeta}
            handleDejarAFiado={handleDejarAFiado}
            totalLista={totalLista}
            totalConDebitoEfectivo={totalConDebitoEfectivo}
            totalConTarjeta={totalConTarjeta}
            DISCOUNT_PERCENT_CASH={DISCOUNT_PERCENT_CASH}
            SURCHARGE_PERCENT_CARD={SURCHARGE_PERCENT_CARD}
          />
        </form>
      </Form>

      {/* Modal selector de productos */}
      <SelectorProductoModal
        mostrarSelectorProducto={mostrarSelectorProducto}
        setMostrarSelectorProducto={setMostrarSelectorProducto}
        busquedaProducto={busquedaProducto}
        setBusquedaProducto={setBusquedaProducto}
        barcodeInput={barcodeInput}
        setBarcodeInput={setBarcodeInput}
        productosFiltrados={productosFiltrados}
        agregarProductoDelModal={agregarProductoDelModal}
      />
    </div>
  );
}
