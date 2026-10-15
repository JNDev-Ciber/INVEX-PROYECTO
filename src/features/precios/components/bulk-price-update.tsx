
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TrendingUp, TrendingDown, Package, Tag, Lightbulb, AlertTriangle, Info, Calculator } from "lucide-react"
import type { Product } from "@/shared/types/inventory"
import { useToast } from "@/hooks/use-toast"

interface BulkPriceUpdateProps {
  products: Product[]
  onUpdatePrices: (category: string, percentage: number, isSubcategory?: boolean) => void
}

export function BulkPriceUpdate({ products, onUpdatePrices }: BulkPriceUpdateProps) {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [percentage, setPercentage] = useState("")
  const [updateType, setUpdateType] = useState<"category" | "subcategory">("category")

  // Obtener categorías únicas
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean)
  
  // ✅ Obtener subcategorías únicas - CORREGIDO
  const subcategories = Array.from(new Set(
    products
      .filter(p => p.subcategory)
      .map((p) => p.subcategory)
  )).filter(Boolean) as string[] // ✅ Asegurar que son strings

  // Productos afectados según el tipo de actualización
  const affectedProducts = (() => {
    if (updateType === "category" && selectedCategory) {
      return products.filter((p) => p.category === selectedCategory)
    } else if (updateType === "subcategory" && selectedSubcategory) {
      return products.filter((p) => p.subcategory === selectedSubcategory)
    }
    return []
  })()

  // Función para manejar cambios en el porcentaje
  const handlePercentageChange = (value: string) => {
    // Permitir vacío, números positivos y negativos, con decimales
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      setPercentage(value)
    }
  }

  // Obtener el valor numérico del porcentaje
  const getPercentageValue = () => {
    const num = parseFloat(percentage)
    return isNaN(num) ? 0 : num
  }

  const handleUpdate = () => {
    const target = updateType === "category" ? selectedCategory : selectedSubcategory
    const percentageValue = getPercentageValue()
    
    if (target && percentageValue !== 0) {
      onUpdatePrices(target, percentageValue, updateType === "subcategory")

      // Notificación de éxito
      const actionText = percentageValue > 0 ? "aumentaron" : "redujeron"
      const TrendIcon = percentageValue > 0 ? TrendingUp : TrendingDown
      const typeText = updateType === "category" ? "categoría" : "subcategoría"

      toast({
        title: (
          <span className="flex items-center gap-2">
            <TrendIcon className="h-4 w-4" />
            Precios actualizados
          </span>
        ),
        description: `Los precios de la ${typeText} "${target}" se ${actionText} ${Math.abs(percentageValue)}%.`,
        duration: 3000,
      })

      // Limpiar formulario
      setSelectedCategory("")
      setSelectedSubcategory("")
      setPercentage("")
    }
  }

  const previewPrices = affectedProducts.map((product) => ({
    ...product,
    newPrice: Math.round(product.price * (1 + getPercentageValue() / 100)),
  }))

  // ✅ Resetear selecciones cuando cambia el tipo - CORREGIDO
  const handleUpdateTypeChange = (type: string) => {
    if (type === 'category' || type === 'subcategory') {
      setUpdateType(type as 'category' | 'subcategory')
      setSelectedCategory("")
      setSelectedSubcategory("")
      setPercentage("")
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Tabs para elegir tipo de actualización */}
        <Tabs 
          value={updateType} 
          onValueChange={handleUpdateTypeChange} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="category" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Por Categoría
            </TabsTrigger>
            <TabsTrigger value="subcategory" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Por Subcategoría
            </TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const categoryProducts = products.filter(p => p.category === category)
                      return (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center justify-between w-full">
                            <span>{category}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({categoryProducts.length} productos)
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {affectedProducts.length} productos en esta categoría
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Porcentaje de Cambio (%)</Label>
                <Input
                  id="percentage"
                  value={percentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  placeholder="10 para aumentar 10%, -5 para reducir 5%"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Usa números positivos para aumentar, negativos para reducir
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subcategory" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoría</Label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.length > 0 ? (
                      subcategories.map((subcategory) => {
                        const subcategoryProducts = products.filter(p => p.subcategory === subcategory)
                        const parentCategory = subcategoryProducts[0]?.category || "Sin categoría"
                        return (
                          <SelectItem key={subcategory} value={subcategory}>
                            <div className="flex flex-col items-start">
                              <span>{subcategory}</span>
                              <span className="text-xs text-muted-foreground">
                                {parentCategory} • {subcategoryProducts.length} productos
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="no-subcategories" disabled>
                        No hay subcategorías disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedSubcategory && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    {affectedProducts.length} productos en esta subcategoría
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage-sub">Porcentaje de Cambio (%)</Label>
                <Input
                  id="percentage-sub"
                  value={percentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  placeholder="10 para aumentar 10%, -5 para reducir 5%"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Usa números positivos para aumentar, negativos para reducir
                </p>
              </div>
            </div>

            {subcategories.length === 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    No hay subcategorías disponibles
                  </strong><br />
                  Para usar esta función, primero agrega subcategorías a tus productos.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Vista previa de productos afectados */}
        {affectedProducts.length > 0 && getPercentageValue() !== 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Vista Previa - {affectedProducts.length} productos afectados:
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/40">
              {previewPrices.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-card rounded border">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{product.name}</span>
                    <div className="text-xs text-muted-foreground">
                      {product.category}{product.subcategory && ` • ${product.subcategory}`}
                    </div>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">${product.price.toLocaleString()}</span>
                    <TrendingUp className={`h-3 w-3 ${getPercentageValue() > 0 ? "text-[hsl(var(--income))]" : "text-destructive"}`} />
                    <span className={`font-medium tabular-nums ${getPercentageValue() > 0 ? "text-[hsl(var(--income))]" : "text-destructive"}`}>
                      ${product.newPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de cambios */}
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-primary font-medium">Productos:</span>
                  <p className="tabular-nums">{affectedProducts.length}</p>
                </div>
                <div>
                  <span className="text-primary font-medium">Cambio:</span>
                  <p className="tabular-nums">{getPercentageValue() > 0 ? '+' : ''}{getPercentageValue()}%</p>
                </div>
                <div>
                  <span className="text-primary font-medium">Valor actual:</span>
                  <p className="tabular-nums">${affectedProducts.reduce((sum, p) => sum + p.price, 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-primary font-medium">Valor nuevo:</span>
                  <p className="tabular-nums">${previewPrices.reduce((sum, p) => sum + p.newPrice, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de actualización con confirmación */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              disabled={
                (updateType === "category" && (!selectedCategory || getPercentageValue() === 0)) ||
                (updateType === "subcategory" && (!selectedSubcategory || getPercentageValue() === 0)) ||
                affectedProducts.length === 0
              }
            >
              <Calculator className="h-4 w-4 mr-2" />
              Actualizar Precios {updateType === "category" ? "por Categoría" : "por Subcategoría"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar actualización de precios?</AlertDialogTitle>
              <AlertDialogDescription>
                Se actualizarán los precios de <strong>{affectedProducts.length} productos</strong> en la{" "}
                {updateType === "category" ? "categoría" : "subcategoría"}{" "}
                "<strong>{updateType === "category" ? selectedCategory : selectedSubcategory}</strong>"
                con un cambio del <strong>{getPercentageValue() > 0 ? "+" : ""}{getPercentageValue()}%</strong>.
                <br /><br />
                <span className="text-destructive inline-flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Esta acción no se puede deshacer.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdate}>
                Confirmar Actualización
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
