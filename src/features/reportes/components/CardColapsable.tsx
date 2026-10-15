import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Card con encabezado colapsable para los reportes: el título (con su
 * ícono) actúa de botón para minimizar/expandir el contenido. Las
 * `acciones` (ej. selector de período, link a CRM) quedan a la derecha,
 * fuera del botón, y siguen visibles aunque esté colapsado.
 */
export function CardColapsable({
  titulo,
  icono,
  acciones,
  defaultOpen = true,
  children,
}: {
  titulo: string;
  icono?: ReactNode;
  acciones?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
          aria-expanded={open}
        >
          {icono}
          <h3 className="font-semibold text-sm">{titulo}</h3>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        {acciones}
      </div>
      {open && children}
    </Card>
  );
}
