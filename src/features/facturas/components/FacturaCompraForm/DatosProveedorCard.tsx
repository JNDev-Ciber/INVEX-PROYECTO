import { useState, useRef, useEffect } from "react"
import type { Control, UseFormSetValue } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Building2, Search } from "lucide-react"
import type { FacturaCompraFormValues } from "../../schemas/factura-compra.schema"
import type { Proveedor } from "@/shared/types/inventory"

interface Props {
  control: Control<FacturaCompraFormValues>
  setValue: UseFormSetValue<FacturaCompraFormValues>
  proveedores?: Proveedor[]
  onProveedorSelected?: (id: string | null) => void
}

export function DatosProveedorCard({ control, setValue, proveedores = [], onProveedorSelected }: Props) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = searchValue.trim()
    ? proveedores.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
          p.cuit?.includes(searchValue)
      )
    : []

  const selectProveedor = (p: Proveedor) => {
    setValue("proveedorNombre", p.nombre)
    setValue("proveedorCuit", p.cuit ?? "")
    setValue("proveedorDireccion", p.direccion ?? "")
    setValue("proveedorTelefono", p.telefono ?? "")
    setValue("proveedorEmail", p.email ?? "")
    setSearchValue(p.nombre)
    setShowDropdown(false)
    onProveedorSelected?.(p.id)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Datos del Proveedor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Nombre con autocomplete */}
          <FormField
            control={control}
            name="proveedorNombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre / Razón Social *</FormLabel>
                <FormControl>
                  <div ref={wrapperRef} className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Buscar proveedor existente o ingresar nuevo..."
                      {...field}
                      className="pl-9"
                      autoComplete="off"
                      onChange={(e) => {
                        field.onChange(e)
                        setSearchValue(e.target.value)
                        setShowDropdown(true)
                        onProveedorSelected?.(null)
                      }}
                      onFocus={() => {
                        setSearchValue(field.value ?? "")
                        setShowDropdown(true)
                      }}
                    />
                    {showDropdown && filtered.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filtered.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProveedor(p)}
                            className="w-full text-left px-3 py-2 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                          >
                            <p className="font-semibold text-sm">{p.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {[p.cuit, p.telefono].filter(Boolean).join(" · ")}
                              {p.saldoPendiente > 0 && (
                                <span className="ml-2 text-orange-600 font-medium">
                                  Deuda: ${p.saldoPendiente.toLocaleString()}
                                </span>
                              )}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proveedorCuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CUIT/DNI</FormLabel>
                <FormControl>
                  <Input placeholder="CUIT del proveedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proveedorDireccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección del proveedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proveedorTelefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Teléfono del proveedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proveedorEmail"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Email (Opcional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@proveedor.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
