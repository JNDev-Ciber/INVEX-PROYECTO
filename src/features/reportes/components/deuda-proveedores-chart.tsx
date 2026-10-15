import { Building2 } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DeudaProveedor } from "@/shared/types/inventory";
import { CardColapsable } from "@/features/reportes/components/CardColapsable";

const COLORS = [
  "#f97316", "#fb923c", "#fdba74",
  "#ea580c", "#c2410c", "#fbbf24",
  "#f59e0b", "#d97706", "#b45309",
];

interface DeudaProveedoresChartProps {
  deuda: DeudaProveedor[];
}

export function DeudaProveedoresChart({ deuda }: DeudaProveedoresChartProps) {
  const totalDeuda = deuda.reduce((s, d) => s + d.saldoPendiente, 0);

  return (
    <CardColapsable
      titulo="Deuda a Proveedores"
      icono={<Building2 className="h-4 w-4 text-orange-600" />}
    >
      {deuda.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Sin deudas pendientes
        </div>
      ) : (
        <>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total adeudado</p>
            <p className="text-2xl font-bold text-orange-600">
              ${totalDeuda.toLocaleString()}
            </p>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={deuda}
                dataKey="saldoPendiente"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={35}
                paddingAngle={2}
              >
                {deuda.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Deuda"]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {deuda.map((d, i) => (
              <div key={d.proveedorId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate max-w-[160px]">{d.nombre}</span>
                </div>
                <span className="font-semibold text-orange-700">
                  ${d.saldoPendiente.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </CardColapsable>
  );
}
