import { Separator } from "@/components/ui/separator";
import type { FacturaVenta } from "./types";

interface Props {
  factura: FacturaVenta;
  porcentajeIva: number;
}

export function VistaPrevia({ factura, porcentajeIva }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-black">
      {/* Header de la factura */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">
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
          <h2 className="text-2xl font-bold text-blue-600 mb-2">
            FACTURA DE VENTA
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

      {/* Datos del cliente */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-600 mb-3">DATOS DEL CLIENTE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <strong>Nombre:</strong> {factura.cliente.nombre}
            </p>
            <p>
              <strong>CUIT/DNI:</strong> {factura.cliente.cuit}
            </p>
            <p>
              <strong>Dirección:</strong> {factura.cliente.direccion}
            </p>
          </div>
          <div>
            <p>
              <strong>Teléfono:</strong> {factura.cliente.telefono}
            </p>
            <p>
              <strong>Email:</strong> {factura.cliente.email}
            </p>
          </div>
        </div>
      </div>

      {/* Items de la factura */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-300 p-3 text-left text-blue-600">
                Código
              </th>
              <th className="border border-gray-300 p-3 text-left text-blue-600">
                Producto
              </th>
              <th className="border border-gray-300 p-3 text-center text-blue-600">
                Cantidad
              </th>
              <th className="border border-gray-300 p-3 text-right text-blue-600">
                Precio Unit.
              </th>
              <th className="border border-gray-300 p-3 text-right text-blue-600">
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
                  ${item.precioUnitario.toLocaleString()}
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
          <div className="flex justify-between py-3 text-lg font-bold text-blue-600">
            <span>TOTAL:</span>
            <span>${factura.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 flex justify-between items-start">
        <div className="text-xs text-gray-500 max-w-md">
          <h4 className="font-bold mb-2 text-gray-700">TÉRMINOS DE GARANTÍA</h4>
          <p className="mb-1">
            • La garantía cubre defectos de fabricación y materiales.
          </p>
          <p className="mb-1">
            • La garantía no cubre daños causados por uso indebido, negligencia
            o accidentes.
          </p>
          <p className="mb-1">
            • Para hacer efectiva la garantía, el cliente saldo presentar este
            recibo y el producto defectuoso.
          </p>
          <p>
            • El cliente saldo devolver el producto defectuoso con su caja y
            accesorios en condiciones admisibles.
          </p>
        </div>
        <div className="text-center text-xs text-gray-500">
          <p>ELECTROLUXSTORE - Sistema de Gestión de Inventarios</p>
          <p>Factura de venta generada electrónicamente</p>
        </div>
      </div>
    </div>
  );
}
