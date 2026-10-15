import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Camera, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as asistenteApi from "@/mocks/asistente";
import type { LecturaFactura, LineaFactura, ProductoFactura } from "@/mocks/asistente";
import { costoConIva, margen, precioSugerido, prepararArchivo } from "@/features/asistente/lib/factura";

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const NUEVO = "__nuevo__";
const claseSelect =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

type Renglon = {
  id: string;
  incluir: boolean;
  productoId: string; // NUEVO = crear producto
  nombre: string;
  categoria: string;
  cantidad: string;
  costo: string;
  precio: string;
  costoEditado: boolean;
  precioEditado: boolean;
};

function renglonInicial(linea: LineaFactura, lectura: LecturaFactura, sumarIva: boolean): Renglon {
  const costo = costoConIva(linea.costo_factura, lectura.alicuota_iva, sumarIva);
  return {
    id: linea.id,
    incluir: true,
    productoId: linea.producto?.id ?? NUEVO,
    nombre: linea.nombre_sugerido,
    categoria: linea.categoria_sugerida ?? "",
    cantidad: String(linea.cantidad),
    costo: String(costo),
    precio: String(precioSugerido(costo, linea.producto, linea.margen_objetivo)),
    costoEditado: false,
    precioEditado: false,
  };
}

function erroresRenglon(r: Renglon) {
  const cantidad = Number(r.cantidad);
  const costo = Number(r.costo);
  const precio = Number(r.precio);
  if (!Number.isInteger(cantidad) || cantidad <= 0) return "La cantidad tiene que ser un número entero mayor a 0";
  if (!(costo > 0)) return "Falta el costo";
  if (!(precio > 0)) return "Falta el precio de venta";
  if (precio < costo) return "El precio de venta es menor al costo";
  if (r.productoId === NUEVO && !r.nombre.trim()) return "Falta el nombre del producto nuevo";
  return null;
}

function RenglonFactura({
  linea,
  renglon,
  productos,
  categorias,
  onChange,
  deshabilitado,
}: {
  linea: LineaFactura;
  renglon: Renglon;
  productos: ProductoFactura[];
  categorias: string[];
  onChange: (cambios: Partial<Renglon>) => void;
  deshabilitado: boolean;
}) {
  const producto = productos.find((p) => p.id === renglon.productoId) ?? null;
  const cantidad = Number(renglon.cantidad) || 0;
  const costo = Number(renglon.costo) || 0;
  const precio = Number(renglon.precio) || 0;
  const error = renglon.incluir ? erroresRenglon(renglon) : null;
  const variacionCosto = producto && producto.costo_actual > 0 ? Math.round((costo / producto.costo_actual - 1) * 1000) / 10 : null;

  const recalcularPrecio = (nuevoProducto: ProductoFactura | null, nuevoCosto: number) =>
    renglon.precioEditado ? {} : { precio: String(precioSugerido(nuevoCosto, nuevoProducto, linea.margen_objetivo)) };

  return (
    <div className={cn("space-y-2 rounded-md border p-3 text-sm", !renglon.incluir && "opacity-50")}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={renglon.incluir}
          onChange={(e) => onChange({ incluir: e.target.checked })}
          disabled={deshabilitado}
          className="mt-1 h-4 w-4 accent-purple-600"
          aria-label="Incluir renglón"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            Leído en la factura: <span className="font-medium text-foreground">{linea.descripcion}</span>
            {linea.codigo_proveedor && ` · cód. ${linea.codigo_proveedor}`}
            {linea.confianza !== "alta" && (
              <span className={cn("ml-2 rounded px-1.5 py-0.5 text-[11px]", linea.confianza === "baja" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                lectura {linea.confianza}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-12">
        <label className="space-y-1 sm:col-span-5">
          <span className="text-xs text-muted-foreground">Producto del inventario</span>
          <select
            className={claseSelect}
            value={renglon.productoId}
            disabled={deshabilitado || !renglon.incluir}
            onChange={(e) => {
              const nuevo = productos.find((p) => p.id === e.target.value) ?? null;
              onChange({ productoId: e.target.value, ...recalcularPrecio(nuevo, costo) });
            }}
          >
            <option value={NUEVO}>➕ Crear producto nuevo</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · {p.codigo}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs text-muted-foreground">Cantidad</span>
          <Input
            type="number"
            min={1}
            value={renglon.cantidad}
            disabled={deshabilitado || !renglon.incluir}
            onChange={(e) => onChange({ cantidad: e.target.value })}
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs text-muted-foreground">Costo unitario</span>
          <Input
            type="number"
            min={1}
            value={renglon.costo}
            disabled={deshabilitado || !renglon.incluir}
            onChange={(e) => onChange({ costo: e.target.value, costoEditado: true, ...recalcularPrecio(producto, Number(e.target.value) || 0) })}
          />
        </label>
        <label className="space-y-1 sm:col-span-3">
          <span className="text-xs text-muted-foreground">Precio de venta</span>
          <Input
            type="number"
            min={1}
            value={renglon.precio}
            disabled={deshabilitado || !renglon.incluir}
            onChange={(e) => onChange({ precio: e.target.value, precioEditado: true })}
          />
        </label>
      </div>

      {renglon.productoId === NUEVO && (
        <div className="grid gap-2 sm:grid-cols-12">
          <label className="space-y-1 sm:col-span-8">
            <span className="text-xs text-muted-foreground">Nombre del producto nuevo</span>
            <Input value={renglon.nombre} disabled={deshabilitado || !renglon.incluir} onChange={(e) => onChange({ nombre: e.target.value })} />
          </label>
          <label className="space-y-1 sm:col-span-4">
            <span className="text-xs text-muted-foreground">Categoría</span>
            <Input
              list="categorias-factura"
              value={renglon.categoria}
              disabled={deshabilitado || !renglon.incluir}
              onChange={(e) => onChange({ categoria: e.target.value.toUpperCase() })}
            />
            <datalist id="categorias-factura">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>
      )}

      {renglon.incluir && (
        <p className="text-xs text-muted-foreground">
          {producto ? (
            <>
              Stock {producto.stock} → {producto.stock + cantidad} · Costo {pesos.format(producto.costo_actual)} → {pesos.format(costo)}
              {variacionCosto !== null && variacionCosto !== 0 && (
                <span className={variacionCosto > 0 ? "text-red-600" : "text-green-600"}>
                  {" "}
                  ({variacionCosto > 0 ? "+" : ""}
                  {variacionCosto}%)
                </span>
              )}{" "}
              · Precio {pesos.format(producto.precio_venta)} → {pesos.format(precio)} · Margen {producto.margen_actual}% → {margen(precio, costo)}%
            </>
          ) : (
            <>
              Producto nuevo con {cantidad} unidades · margen {margen(precio, costo)}%
            </>
          )}
          {!renglon.precioEditado && producto && precio > producto.precio_venta && (
            <span className="text-purple-700 dark:text-purple-300"> · precio sugerido para no perder margen</span>
          )}
        </p>
      )}
      {linea.avisos.map((a) => (
        <p key={a} className="flex items-center gap-1 text-xs text-amber-700">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {a}
        </p>
      ))}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function RevisionFactura({
  lectura,
  vistaPrevia,
  onCancelar,
  onListo,
}: {
  lectura: LecturaFactura;
  vistaPrevia: string | null;
  onCancelar: () => void;
  onListo: (mensaje: string) => void;
}) {
  const queryClient = useQueryClient();
  const [sumarIva, setSumarIva] = useState(lectura.iva_discriminado);
  const [proveedorId, setProveedorId] = useState(lectura.proveedor_id ?? "");
  const [numero, setNumero] = useState(lectura.numero);
  const [renglones, setRenglones] = useState(() => lectura.lineas.map((l) => renglonInicial(l, lectura, lectura.iva_discriminado)));

  const confirmar = useMutation({
    mutationFn: asistenteApi.confirmarFactura,
    onSuccess: (data) => {
      // Cambió stock, costos y precios; y pueden haberse completado reposiciones del agente.
      queryClient.invalidateQueries();
      onListo(data.mensaje);
    },
  });

  const cambiar = (id: string, cambios: Partial<Renglon>) =>
    setRenglones((prev) => prev.map((r) => (r.id === id ? { ...r, ...cambios } : r)));

  const cambiarIva = (valor: boolean) => {
    setSumarIva(valor);
    setRenglones((prev) =>
      prev.map((r) => {
        if (r.costoEditado) return r;
        const linea = lectura.lineas.find((l) => l.id === r.id)!;
        const costo = costoConIva(linea.costo_factura, lectura.alicuota_iva, valor);
        const producto = lectura.productos.find((p) => p.id === r.productoId) ?? null;
        return {
          ...r,
          costo: String(costo),
          precio: r.precioEditado ? r.precio : String(precioSugerido(costo, producto, linea.margen_objetivo)),
        };
      }),
    );
  };

  const incluidos = renglones.filter((r) => r.incluir);
  const hayErrores = incluidos.some((r) => erroresRenglon(r));
  const unidades = incluidos.reduce((s, r) => s + (Number(r.cantidad) || 0), 0);
  const total = incluidos.reduce((s, r) => s + (Number(r.cantidad) || 0) * (Number(r.costo) || 0), 0);
  const nombreProveedor = lectura.proveedores.find((v) => v.id === proveedorId)?.nombre;
  const trabajando = confirmar.isPending;

  const enviar = () =>
    confirmar.mutate({
      proveedor_id: proveedorId || null,
      numero,
      items: incluidos.map((r) => ({
        producto_id: r.productoId === NUEVO ? null : r.productoId,
        nombre: r.nombre.trim(),
        categoria: r.categoria.trim(),
        cantidad: Number(r.cantidad),
        costo_unitario: Number(r.costo),
        precio_venta: Number(r.precio),
      })),
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div className="space-y-2">
        {vistaPrevia ? (
          <a href={vistaPrevia} target="_blank" rel="noreferrer" title="Ver la foto completa">
            <img src={vistaPrevia} alt="Factura cargada" className="w-full rounded-md border lg:sticky lg:top-4" />
          </a>
        ) : (
          <Card className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Factura en PDF
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <Card className="space-y-3 p-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Proveedor</span>
              <select className={claseSelect} value={proveedorId} disabled={trabajando} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Sin proveedor (no registra deuda)</option>
                {lectura.proveedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
              {lectura.proveedor_leido.nombre && (
                <span className="block text-xs text-muted-foreground">
                  Leído: {lectura.proveedor_leido.nombre}
                  {lectura.proveedor_leido.cuit && ` · CUIT ${lectura.proveedor_leido.cuit}`}
                  {!lectura.proveedor_id && " (no está registrado)"}
                </span>
              )}
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Número de factura</span>
              <Input value={numero} disabled={trabajando} onChange={(e) => setNumero(e.target.value)} />
              <span className="block text-xs text-muted-foreground">
                {lectura.fecha ? `Fecha ${lectura.fecha.split("-").reverse().join("/")}` : "Sin fecha leída"}
                {lectura.total_factura ? ` · Total impreso ${pesos.format(lectura.total_factura)}` : ""}
              </span>
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sumarIva}
              disabled={trabajando}
              onChange={(e) => cambiarIva(e.target.checked)}
              className="h-4 w-4 accent-purple-600"
            />
            Sumar IVA ({lectura.alicuota_iva}%) al costo
            <span className="text-xs text-muted-foreground">
              {lectura.iva_discriminado ? "· la factura muestra el IVA aparte" : "· la factura no discrimina IVA"}
            </span>
          </label>
          {lectura.avisos.map((a) => (
            <p key={a} className="flex items-start gap-1 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {a}
            </p>
          ))}
        </Card>

        {lectura.lineas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No encontré renglones de productos en este archivo.</p>
        ) : (
          lectura.lineas.map((linea) => (
            <RenglonFactura
              key={linea.id}
              linea={linea}
              renglon={renglones.find((r) => r.id === linea.id)!}
              productos={lectura.productos}
              categorias={lectura.categorias}
              onChange={(cambios) => cambiar(linea.id, cambios)}
              deshabilitado={trabajando}
            />
          ))
        )}

        <Card className="space-y-2 p-4 text-sm">
          <p>
            {incluidos.length} {incluidos.length === 1 ? "renglón" : "renglones"} · {unidades} unidades · Total a costo{" "}
            <span className="font-semibold">{pesos.format(total)}</span>
            {nombreProveedor && <span className="text-muted-foreground"> · queda como deuda con {nombreProveedor}</span>}
          </p>
          {confirmar.error && <p className="text-xs text-red-600">{confirmar.error.message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={enviar} disabled={trabajando || incluidos.length === 0 || hayErrores} className="bg-purple-600 hover:bg-purple-700">
              {trabajando && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Confirmar ingreso al stock
            </Button>
            <Button variant="ghost" onClick={onCancelar} disabled={trabajando}>
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Se actualizan stock, costo y precio de venta de cada producto, se crean los nuevos y se registra la compra. Todo junto o nada.
          </p>
        </Card>
      </div>
    </div>
  );
}

export function FacturaFotoPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [listo, setListo] = useState<string | null>(null);

  const leer = useMutation({ mutationFn: asistenteApi.leerFactura });

  const reiniciar = () => {
    leer.reset();
    setVistaPrevia(null);
    setErrorArchivo(null);
    setListo(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const elegirArchivo = async (file: File | undefined) => {
    if (!file) return;
    reiniciar();
    setPreparando(true);
    try {
      const { archivo, vistaPrevia: vista } = await prepararArchivo(file);
      setVistaPrevia(vista);
      leer.mutate(archivo);
    } catch (err) {
      setErrorArchivo(err instanceof Error ? err.message : "No pude abrir el archivo");
    } finally {
      setPreparando(false);
    }
  };

  if (listo) {
    return (
      <Card className="space-y-3 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          Factura ingresada
        </p>
        <p>{listo}</p>
        <Button variant="outline" onClick={reiniciar}>
          <Camera className="mr-1 h-4 w-4" />
          Cargar otra factura
        </Button>
      </Card>
    );
  }

  if (leer.data) {
    return <RevisionFactura key={leer.data.numero + leer.data.lineas.length} lectura={leer.data} vistaPrevia={vistaPrevia} onCancelar={reiniciar} onListo={setListo} />;
  }

  const ocupado = preparando || leer.isPending;

  return (
    <Card
      className={cn(
        "flex flex-col items-center gap-3 border-2 border-dashed p-8 text-center text-sm transition-colors",
        arrastrando && "border-purple-500 bg-purple-50 dark:bg-purple-950/30",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        if (!ocupado) elegirArchivo(e.dataTransfer.files?.[0]);
      }}
    >
      {ocupado ? (
        <>
          {vistaPrevia && <img src={vistaPrevia} alt="Factura" className="max-h-48 rounded-md border" />}
          <p className="flex items-center gap-2 font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            Leyendo la factura y buscando cada producto en el inventario…
          </p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Cargá la mercadería con una foto de la factura</p>
            <p className="text-muted-foreground">
              Sacale una foto a la factura o remito del proveedor (o subí el PDF). La IA lee los productos, cantidades y costos, los
              busca en tu inventario y te sugiere precios si subió el costo. Revisás y confirmás.
            </p>
          </div>
          <Button onClick={() => inputRef.current?.click()} className="bg-purple-600 hover:bg-purple-700">
            <Upload className="mr-1 h-4 w-4" />
            Elegir foto o PDF
          </Button>
          <p className="text-xs text-muted-foreground">También podés arrastrar el archivo acá.</p>
        </>
      )}
      {(errorArchivo || leer.error) && <p className="text-sm text-red-600">{errorArchivo ?? leer.error?.message}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => elegirArchivo(e.target.files?.[0])}
      />
    </Card>
  );
}
