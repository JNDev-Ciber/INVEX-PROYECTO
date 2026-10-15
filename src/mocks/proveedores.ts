import type { DeudaProveedor, Proveedor } from "@/shared/types/inventory";
import { DB, clone, delay, fail, uid } from "@/mocks/db";

export async function getAllProveedores(): Promise<Proveedor[]> {
  return delay(clone(DB.proveedores.filter((p) => p.activo)));
}

export async function agregarProveedor(
  nombre: string,
  cuit?: string,
  telefono?: string,
  email?: string,
  direccion?: string,
) {
  const id = uid("prov");
  DB.proveedores.push({
    id,
    nombre,
    cuit: cuit || undefined,
    telefono: telefono || undefined,
    email: email || undefined,
    direccion: direccion || undefined,
    saldoPendiente: 0,
    activo: true,
  });
  return delay(id);
}

export async function editarProveedor(
  id: string,
  nombre: string,
  cuit?: string,
  telefono?: string,
  email?: string,
  direccion?: string,
) {
  const p = DB.proveedores.find((x) => x.id === id);
  if (!p) fail("Proveedor no encontrado");
  p.nombre = nombre;
  p.cuit = cuit || undefined;
  p.telefono = telefono || undefined;
  p.email = email || undefined;
  p.direccion = direccion || undefined;
  return delay(true);
}

export async function eliminarProveedor(proveedorId: string) {
  const p = DB.proveedores.find((x) => x.id === proveedorId);
  if (!p) fail("Proveedor no encontrado");
  p.activo = false;
  return delay(true);
}

export async function agregarDeudaDirectaProveedor(proveedorId: string, monto: number, concepto: string) {
  const p = DB.proveedores.find((x) => x.id === proveedorId);
  if (!p) fail("Proveedor no encontrado");
  const ahora = new Date().toISOString();
  DB.comprasProveedor.push({
    id: uid("compra"),
    proveedorId,
    fecha: ahora.slice(0, 10),
    total: monto,
    saldoPendiente: monto,
    concepto: concepto || "Deuda manual",
    detalles: null,
    createdAt: ahora,
  });
  p.saldoPendiente += monto;
  return delay(true);
}

export async function registrarPagoProveedor(proveedorId: string, monto: number, concepto?: string) {
  const p = DB.proveedores.find((x) => x.id === proveedorId);
  if (!p) fail("Proveedor no encontrado");
  if (monto > p.saldoPendiente) fail("El pago supera la deuda con el proveedor");

  // Se imputa a las compras más antiguas primero.
  let restante = monto;
  const compras = DB.comprasProveedor
    .filter((c) => c.proveedorId === proveedorId && c.saldoPendiente > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const c of compras) {
    if (restante <= 0) break;
    const aplicado = Math.min(c.saldoPendiente, restante);
    c.saldoPendiente -= aplicado;
    restante -= aplicado;
    DB.pagosProveedor.push({
      id: uid("pp"),
      proveedorId,
      compraId: c.id,
      monto: aplicado,
      fecha: new Date().toISOString(),
      concepto: concepto || undefined,
    });
  }
  p.saldoPendiente -= monto;
  return delay(true);
}

export async function getDeudaProveedores(): Promise<DeudaProveedor[]> {
  return delay(
    DB.proveedores
      .filter((p) => p.activo && p.saldoPendiente > 0)
      .map((p) => ({ proveedorId: p.id, nombre: p.nombre, saldoPendiente: p.saldoPendiente })),
  );
}
