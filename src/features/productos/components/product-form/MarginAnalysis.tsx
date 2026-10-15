
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";

interface MarginAnalysisProps {
  isDark: boolean;
  margin: number;
  cost: string;
  price: string;
}

export function MarginAnalysis({ margin, cost, price }: MarginAnalysisProps) {
  const toneClass =
    margin > 0
      ? "text-blue-600 dark:text-blue-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        margin > 0
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className={`h-4 w-4 ${toneClass}`} />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Análisis de Margen
          </span>
        </div>
        <Badge variant={margin > 0 ? "default" : "destructive"}>
          {margin.toFixed(2)}%
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Costo:</span>
          <p className="font-medium">
            ${parseFloat(cost || "0").toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Precio:</span>
          <p className="font-medium">
            ${parseFloat(price || "0").toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Ganancia:</span>
          <p className={`font-medium ${toneClass}`}>
            $
            {(
              parseFloat(price || "0") - parseFloat(cost || "0")
            ).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Margen:</span>
          <p className={`font-medium ${toneClass}`}>{margin.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
