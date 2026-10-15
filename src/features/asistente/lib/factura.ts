import type { ArchivoFactura, ProductoFactura } from "@/mocks/asistente";

// Las fotos se achican antes de subirlas: alcanza para leer la factura y el
// envío es mucho más liviano (el límite de la API es de pocos MB).
const LADO_MAXIMO = 1800;
const MAX_PDF_BYTES = 4_500_000;

function leerComoDataUrl(archivo: Blob) {
  return new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error("No pude leer el archivo"));
    lector.readAsDataURL(archivo);
  });
}

function cargarImagen(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No pude abrir la imagen. Probá con una foto JPG o PNG."));
    img.src = url;
  });
}

export async function prepararArchivo(file: File): Promise<{ archivo: ArchivoFactura; vistaPrevia: string | null }> {
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) throw new Error("El PDF es muy grande (máximo 4,5 MB)");
    const dataUrl = await leerComoDataUrl(file);
    return { archivo: { media_type: "application/pdf", data: dataUrl.split(",")[1] }, vistaPrevia: null };
  }
  if (!file.type.startsWith("image/")) throw new Error("Subí una foto o un PDF de la factura");

  const url = URL.createObjectURL(file);
  try {
    const img = await cargarImagen(url);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No pude procesar la imagen");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { archivo: { media_type: "image/jpeg", data: dataUrl.split(",")[1] }, vistaPrevia: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function margen(precio: number, costo: number) {
  return precio > 0 ? Math.round(((precio - costo) * 1000) / precio) / 10 : 0;
}

// Precio de lista que deja el margen pedido, redondeado hacia arriba a $100 (igual que el servidor).
export function precioParaMargen(costo: number, margenPct: number) {
  if (costo <= 0 || margenPct >= 100) return 0;
  return Math.ceil(costo / (1 - margenPct / 100) / 100) * 100;
}

export function costoConIva(costoFactura: number, alicuota: number, sumarIva: boolean) {
  return Math.round(costoFactura * (sumarIva ? 1 + alicuota / 100 : 1));
}

// Si el costo subió, se sugiere el precio que mantiene el margen que tenía el
// producto (nunca uno más bajo que el actual). Si es nuevo, el margen típico de su categoría.
export function precioSugerido(costo: number, producto: ProductoFactura | null, margenProductoNuevo: number) {
  if (producto) {
    if (costo <= producto.costo_actual || producto.precio_venta <= 0) return producto.precio_venta;
    return Math.max(producto.precio_venta, precioParaMargen(costo, Math.max(producto.margen_actual, 0)));
  }
  return precioParaMargen(costo, margenProductoNuevo);
}
