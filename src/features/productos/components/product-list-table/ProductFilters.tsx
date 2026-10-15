

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  FileSpreadsheet,
  Grid3X3,
  List,
  ChevronDown,
} from "lucide-react";
import type { Product } from "@/shared/types/inventory";
import {
  exportInventoryToExcel,
  exportInventoryToHTML,
} from "@/shared/lib/excel-export";
import { useToast } from "@/hooks/use-toast";

interface ProductFiltersProps {
  isDark: boolean;
  isMobile: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  viewMode: "table" | "grid";
  onViewModeChange: (value: "table" | "grid") => void;
  categories: string[];
  selectedCategory: string;
  onSelectedCategoryChange: (value: string) => void;
  filteredSubcategories: (string | undefined)[];
  selectedSubcategory: string;
  onSelectedSubcategoryChange: (value: string) => void;
  onClearFilters: () => void;
  filteredProducts: Product[];
}

export function ProductFilters({
  isDark,
  isMobile,
  searchTerm,
  onSearchTermChange,
  viewMode,
  onViewModeChange,
  categories,
  selectedCategory,
  onSelectedCategoryChange,
  filteredSubcategories,
  selectedSubcategory,
  onSelectedSubcategoryChange,
  onClearFilters,
  filteredProducts,
}: ProductFiltersProps) {
  const { toast } = useToast();

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("table")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Tabla
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => onSelectedCategoryChange(e.target.value)}
            className={`px-3 py-2 border rounded-md text-sm transition-colors ${
              isDark
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            }`}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedSubcategory}
            onChange={(e) => onSelectedSubcategoryChange(e.target.value)}
            disabled={
              selectedCategory === "all" || filteredSubcategories.length === 0
            }
            className={`px-3 py-2 border rounded-md text-sm transition-colors ${
              selectedCategory === "all" || filteredSubcategories.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            } ${
              isDark
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            }`}
          >
            <option value="all">
              {selectedCategory === "all"
                ? "Selecciona categoría primero"
                : "Todas las subcategorías"}
            </option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>

          {(selectedCategory !== "all" || selectedSubcategory !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              Limpiar filtros
            </Button>
          )}

        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                exportInventoryToExcel(filteredProducts);
                toast({
                  title: "Inventario exportado a Excel",
                  description: "El archivo .csv se descargó correctamente.",
                  duration: 3000,
                });
              }}
              className={
                isDark
                  ? "hover:bg-gray-700 hover:text-gray-100"
                  : "hover:bg-gray-100 hover:text-gray-900"
              }
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar a Excel (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                exportInventoryToHTML(filteredProducts);
                toast({
                  title: "x Inventario exportado a HTML",
                  description: "El reporte se descargó como archivo HTML.",
                  duration: 3000,
                });
              }}
              className={
                isDark
                  ? "hover:bg-gray-700 hover:text-gray-100"
                  : "hover:bg-gray-100 hover:text-gray-900"
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar a HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
