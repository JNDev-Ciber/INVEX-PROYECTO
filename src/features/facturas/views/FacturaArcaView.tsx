

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Receipt, Info } from "lucide-react";

export default function FacturaArcaView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Facturación AFIP
        </h2>
        <p className="text-muted-foreground">
          Emití facturas electrónicas a través del sistema oficial de AFIP
        </p>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Acceder al sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para emitir facturas electrónicas, utilizá el sistema oficial de
            AFIP.
          </p>
          <Button
            onClick={() =>
              window.open(
                "https://serviciosweb.afip.gob.ar/facturacion/default.asp",
                "_blank",
                "noopener,noreferrer"
              )
            }
            size="lg"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Ir a facturar en AFIP
          </Button>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Importante
              </span>
            </div>
            <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                Vas a ingresar con tu clave fiscal.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                Las facturas se generan directamente en AFIP.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                Luego podés registrar la venta en este sistema.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
