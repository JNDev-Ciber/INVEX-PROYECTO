
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VistaPrevia } from "./VistaPrevia"
import type { FacturaCompra } from "./types"

interface Props {
  mostrarVistaPrevia: boolean
  setMostrarVistaPrevia: React.Dispatch<React.SetStateAction<boolean>>
  facturaActual: FacturaCompra
  porcentajeIva: number
}

export function VistaPreviaModal({
  mostrarVistaPrevia,
  setMostrarVistaPrevia,
  facturaActual,
  porcentajeIva,
}: Props) {
  return (
    <Dialog open={mostrarVistaPrevia} onOpenChange={setMostrarVistaPrevia}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-green-600">Factura de Compra Procesada</span>
          </DialogTitle>
        </DialogHeader>
        <VistaPrevia factura={facturaActual} porcentajeIva={porcentajeIva} />
      </DialogContent>
    </Dialog>
  )
}
