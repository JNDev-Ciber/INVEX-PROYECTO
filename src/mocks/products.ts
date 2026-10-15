import type { Product } from "@/shared/types/inventory";
import { DB, delay, fail, sucursalActualId, stockEn, stockTotal, uid, type ProductoDb } from "@/mocks/db";

function toProduct(p: ProductoDb): Product {
  const sucursalId = sucursalActualId();
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category || "Sin categoría",
    subcategory: p.subcategory || "",
    price: p.price,
    cost: p.cost,
    quantity: stockEn(p, sucursalId),
    totalQuantity: stockTotal(p),
    minStock: p.minStock,
    description: p.description,
    imageUrl: p.imageUrl,
    barcode: p.barcode,
    discountActive: p.discountActive,
    discountPercent: p.discountPercent,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function activos(): ProductoDb[] {
  return DB.productos.filter((p) => p.activo);
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export async function getProductsPage(limit: number, offset: number) {
  const rows = activos().slice(offset, offset + limit);
  return delay({ items: rows.map(toProduct), raw: rows });
}

export async function searchProductsAll(query: string, limit: number, offset: number) {
  const q = normalizar(query.trim());
  const rows = activos()
    .filter(
      (p) =>
        normalizar(p.name).includes(q) ||
        normalizar(p.code).includes(q) ||
        normalizar(p.category).includes(q) ||
        p.barcode.includes(q),
    )
    .slice(offset, offset + limit);
  return delay({ items: rows.map(toProduct), raw: rows });
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const found = activos().find((p) => p.barcode && p.barcode === barcode);
  return delay(found ? toProduct(found) : undefined);
}

export async function agregarProducto(
  productData: Omit<Product, "id" | "createdAt" | "updatedAt"> & {
    subcategory?: string;
    imageUrl?: string;
  },
) {
  if (DB.productos.some((p) => p.activo && p.code.toLowerCase() === productData.code.toLowerCase())) {
    fail("Ya existe un producto con ese código");
  }
  const id = uid("prod");
  DB.productos.push({
    id,
    code: productData.code,
    name: productData.name,
    category: productData.category,
    subcategory: productData.subcategory || "",
    price: productData.price,
    cost: productData.cost,
    stock: { [sucursalActualId()]: productData.quantity },
    minStock: productData.minStock,
    description: productData.description || "",
    imageUrl: productData.imageUrl || "",
    barcode: productData.barcode || "",
    discountActive: false,
    discountPercent: 0,
    activo: true,
  });
  return delay(id);
}

export async function editarProducto(args: {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  cost: number;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  barcode?: string | null;
  subcategory?: string | null;
}) {
  const p = DB.productos.find((x) => x.id === String(args.id));
  if (!p) fail("Producto no encontrado");
  p.code = args.code;
  p.name = args.name;
  p.category = args.category;
  p.stock[sucursalActualId()] = args.quantity ?? 0;
  p.minStock = args.minStock ?? 0;
  p.cost = args.cost ?? 0;
  p.price = args.price ?? 0;
  p.description = args.description ?? "";
  p.imageUrl = args.imageUrl ?? "";
  p.barcode = args.barcode ?? "";
  p.subcategory = args.subcategory ?? "";
  return delay(true);
}

export async function desactivarProducto(productId: string) {
  const p = DB.productos.find((x) => x.id === productId);
  if (!p) fail("Producto no encontrado");
  p.activo = false;
  return delay(true);
}

export async function actualizarCodigoBarras(id: string, barcode: string) {
  const p = DB.productos.find((x) => x.id === id);
  if (!p) fail("Producto no encontrado");
  p.barcode = barcode;
  return delay(true);
}

export async function actualizarDescuento(id: string, discountPercent: number, discountActive: boolean) {
  const p = DB.productos.find((x) => x.id === id);
  if (!p) fail("Producto no encontrado");
  p.discountPercent = discountPercent;
  p.discountActive = discountActive;
  return delay(true);
}

export async function actualizarPreciosCategoria(category: string, percentage: number) {
  let actualizados = 0;
  for (const p of DB.productos) {
    if (p.activo && p.category === category) {
      p.price = Math.round(p.price * (1 + percentage / 100));
      actualizados += 1;
    }
  }
  return delay({ actualizados });
}
