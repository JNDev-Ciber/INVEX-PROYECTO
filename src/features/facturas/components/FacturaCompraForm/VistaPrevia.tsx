import { Separator } from "@/components/ui/separator";
import type { FacturaCompra } from "./types";

interface Props {
  factura: FacturaCompra;
  porcentajeIva: number;
}

export function VistaPrevia({ factura, porcentajeIva }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-black">
      {/* Header de la factura */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-600">
                ELECTROLUXSTORE
              </h1>
              <p className="text-sm text-gray-600">
                Sistema de Gestión de Inventarios
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Dirección: Hipolito Irigoyen Esquina Ruta 13</p>
            <p>Teléfono: +54 9 3573 40-0674</p>
            <p>Email: electrolux.vdr@gmail.com</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            FACTURA DE COMPRA
          </h2>
          <div className="text-sm space-y-1">
            <div>
              <strong>Número:</strong> {factura.numero}
            </div>
            <div>
              <strong>Fecha:</strong>{" "}
              {new Date(factura.fecha).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Datos del proveedor */}
      <div className="mb-8 p-4 bg-green-50 rounded-lg">
        <h3 className="font-bold text-green-600 mb-3">DATOS DEL PROVEEDOR</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <strong>Nombre:</strong> {factura.proveedor.nombre}
            </p>
            <p>
              <strong>CUIT/DNI:</strong> {factura.proveedor.cuit}
            </p>
            <p>
              <strong>Dirección:</strong> {factura.proveedor.direccion}
            </p>
          </div>
          <div>
            <p>
              <strong>Teléfono:</strong> {factura.proveedor.telefono}
            </p>
            <p>
              <strong>Email:</strong> {factura.proveedor.email}
            </p>
          </div>
        </div>
      </div>

      {/* Items de la factura */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-gray-300 p-3 text-left text-green-600">
                Código
              </th>
              <th className="border border-gray-300 p-3 text-left text-green-600">
                Producto
              </th>
              <th className="border border-gray-300 p-3 text-center text-green-600">
                Cantidad
              </th>
              <th className="border border-gray-300 p-3 text-right text-green-600">
                Costo Unit.
              </th>
              <th className="border border-gray-300 p-3 text-right text-green-600">
                Precio Venta
              </th>
              <th className="border border-gray-300 p-3 text-right text-green-600">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {factura.items.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-3 text-sm">
                  {item.producto.code}
                </td>
                <td className="border border-gray-300 p-3">
                  {item.producto.name}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {item.cantidad}
                </td>
                <td className="border border-gray-300 p-3 text-right">
                  ${item.costoUnitario.toLocaleString()}
                </td>
                <td className="border border-gray-300 p-3 text-right">
                  ${item.precioVentaUnitario.toLocaleString()}
                </td>
                <td className="border border-gray-300 p-3 text-right font-medium">
                  ${item.subtotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${factura.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>IVA ({porcentajeIva}%):</span>
            <span>${factura.iva.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between py-3 text-lg font-bold text-green-600">
            <span>TOTAL:</span>
            <span>${factura.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      {factura.observaciones && (
        <div className="mb-8">
          <h3 className="font-bold text-green-600 mb-2">OBSERVACIONES</h3>
          <p className="text-sm bg-gray-50 p-3 rounded">
            {factura.observaciones}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>ELECTROLUXSTORE - Sistema de Gestión de Inventarios</p>
        <p>Factura de compra generada electrónicamente</p>
      </div>
    </div>
  );
}
