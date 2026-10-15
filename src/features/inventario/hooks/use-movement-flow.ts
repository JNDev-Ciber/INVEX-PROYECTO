

import { useState } from "react";
import type { Product } from "@/shared/types/inventory";
import type { RegistrarMovimientoAtribucion } from "@/mocks/movements";

type ConnectionStatus = "connecting" | "connected" | "error" | "offline";
export type MovementType = "entrada" | "salida";

const getEffectiveSalePrice = (product: Product) => {
  return Math.round(Number(product.price ?? 0));
};

export function useMovementFlow({
  connectionStatus,
  addMovement,
  adjustStockTotal,
  onMovementSuccess,
  currentUser,
}: {
  connectionStatus: ConnectionStatus;
  addMovement: (
    productId: string,
    type: MovementType,
    quantity: number,
    reason: string,
    price?: number,
    atribucion?: RegistrarMovimientoAtribucion,
    fecha?: string | null
  ) => Promise<boolean>;
  // Calcula la diferencia contra el stock real en el servidor, en el mismo
  // instante en que se aplica (evita usar un stock leido antes, que puede
  // quedar viejo si el modal quedo abierto un rato).
  adjustStockTotal: (
    productId: string,
    stockNuevo: number,
    reason: string,
    price?: number,
    atribucion?: RegistrarMovimientoAtribucion
  ) => Promise<{ tipo: MovementType; cantidad: number }>;
  onMovementSuccess?: (args: {
    product: Product;
    type: MovementType;
    quantity: number;
    unitValue: number;
    reason: string;
  }) => void;
  currentUser?: { id?: string | number; username?: string } | null;
}) {
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] =
    useState<Product | null>(null);
  const [movementType, setMovementType] = useState<MovementType>("entrada");
  const [movementQuantity, setMovementQuantity] = useState("1");
  // Solo aplica a "Agregar Stock": si es "sumar", movementQuantity es una
  // cantidad a sumar (comportamiento de siempre). Si es "total", es el
  // stock final que el usuario tipea (como hacia antes en Editar
  // Producto) y se calcula la diferencia real a registrar.
  const [stockInputMode, setStockInputModeState] = useState<"sumar" | "total">(
    "sumar"
  );
  const [movementUnitValue, setMovementUnitValue] = useState("0");
  // Metodo de pago de la venta (solo aplica a "Registrar Venta" / entrada).
  // Sin esto el motivo dice "Debito/Efectivo" en texto pero metodo_pago
  // quedaba null en la DB, y Cerrar Caja no podia contarlo.
  const [movementMetodoPago, setMovementMetodoPago] = useState<
    string | undefined
  >(undefined);
  const [movementReason, setMovementReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [useCustomReason, setUseCustomReason] = useState(false);
  const [movementError, setMovementError] = useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  // Venta/reposicion olvidada de otro dia: si se tilda, se manda esa
  // fecha al backend en vez de "ahora", asi Movimientos y Cerrar Caja lo
  // ubican en el dia real, no en hoy.
  const [esOtroDia, setEsOtroDia] = useState(false);
  const [fechaOtroDia, setFechaOtroDia] = useState("");

  const resetMovementForm = () => {
    setShowMovementModal(false);
    setSelectedProductForMovement(null);
    setMovementQuantity("1");
    setMovementUnitValue("0");
    setMovementReason("");
    setCustomReason("");
    setUseCustomReason(false);
    setMovementError("");
    setStockInputModeState("sumar");
    setMovementMetodoPago(undefined);
    setEsOtroDia(false);
    setFechaOtroDia("");
  };

  const setStockInputMode = (mode: "sumar" | "total") => {
    setStockInputModeState(mode);
    setMovementError("");
    if (mode === "total" && selectedProductForMovement) {
      setMovementQuantity(String(selectedProductForMovement.quantity));
    } else if (mode === "sumar") {
      setMovementQuantity("5");
    }
  };

  const openQuickSale = (product: Product) => {
    if (product.quantity > 0) {
      setSelectedProductForMovement(product);
      setMovementType("entrada");
      setMovementQuantity("1");
      setMovementUnitValue(String(getEffectiveSalePrice(product)));
      setMovementReason("Venta a cliente");
      setCustomReason("");
      setUseCustomReason(false);
      setMovementMetodoPago(undefined);
      setEsOtroDia(false);
      setFechaOtroDia("");
      setShowMovementModal(true);
    }
  };

  const openQuickStock = (product: Product) => {
    setSelectedProductForMovement(product);
    setMovementType("salida");
    setStockInputModeState("sumar");
    setMovementQuantity("5");
    setMovementUnitValue(String(product.cost ?? 0));
    setMovementReason("Reposición de stock");
    setCustomReason("");
    setUseCustomReason(false);
    setEsOtroDia(false);
    setFechaOtroDia("");
    setShowMovementModal(true);
  };

  const submitMovement = async () => {
    if (connectionStatus === "offline") return;

    setMovementError("");
    setIsSubmittingMovement(true);

    try {
      const finalReason = useCustomReason ? customReason.trim() : movementReason;
      const unitValue = Number(
        movementType === "entrada"
          ? movementUnitValue || selectedProductForMovement?.price || 0
          : movementUnitValue || 0
      );

      if (!finalReason) {
        setMovementError("El motivo del movimiento es obligatorio");
        return;
      }

      if (!selectedProductForMovement) return;

      if (movementType === "salida" && unitValue <= 0) {
        setMovementError("El costo unitario debe ser mayor a 0");
        return;
      }

      // En modo "total" (solo Agregar Stock) el usuario tipea el stock
      // final, no una cantidad a sumar: la diferencia real se calcula en
      // el servidor, contra el stock que haya en ese instante exacto (no
      // el que se leyo cuando se abrio el modal), para que no se pueda
      // pisar una venta que haya entrado mientras tanto.
      if (movementType === "salida" && stockInputMode === "total") {
        const nuevoTotal = Number(movementQuantity);
        if (movementQuantity === "" || Number.isNaN(nuevoTotal) || nuevoTotal < 0) {
          setMovementError("El stock nuevo tiene que ser un número válido");
          return;
        }

        // Se atribuye siempre al usuario logueado, sea cual sea la
        // direccion final: el reporte de ventas por empleado ya filtra
        // por tipo/metodo_pago, asi que un ajuste hacia arriba (salida)
        // no infla ventas, solo queda quien hizo el ajuste.
        const { tipo, cantidad } = await adjustStockTotal(
          selectedProductForMovement.id,
          nuevoTotal,
          finalReason,
          unitValue,
          {
            usuarioId: currentUser?.id,
            usuarioNombre: currentUser?.username,
          }
        );

        onMovementSuccess?.({
          product: selectedProductForMovement,
          type: tipo,
          quantity: cantidad,
          unitValue,
          reason: finalReason,
        });

        resetMovementForm();
        return;
      }

      const quantity = Number(movementQuantity);
      if (quantity <= 0) {
        setMovementError("La cantidad debe ser mayor a 0");
        return;
      }

      let fechaBackdated: string | null = null;
      if (esOtroDia) {
        if (!fechaOtroDia) {
          setMovementError("Elegí la fecha en la que pasó");
          return;
        }
        const fechaElegida = new Date(`${fechaOtroDia}T12:00:00`);
        if (Number.isNaN(fechaElegida.getTime()) || fechaElegida > new Date()) {
          setMovementError("La fecha no puede ser futura");
          return;
        }
        fechaBackdated = fechaElegida.toISOString();
      }

      // "entrada" es una venta (el tipo refleja el flujo de dinero, no el de
      // stock), asi que se atribuye al usuario logueado para que sume en el
      // reporte de ventas por empleado.
      await addMovement(
        selectedProductForMovement.id,
        movementType,
        quantity,
        finalReason,
        unitValue,
        movementType === "entrada"
          ? {
              usuarioId: currentUser?.id,
              usuarioNombre: currentUser?.username,
              metodoPago: movementMetodoPago,
            }
          : undefined,
        fechaBackdated
      );

      onMovementSuccess?.({
        product: selectedProductForMovement,
        type: movementType,
        quantity,
        unitValue,
        reason: finalReason,
      });

      resetMovementForm();
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  return {
    showMovementModal,
    setShowMovementModal,
    selectedProductForMovement,
    movementType,
    stockInputMode,
    setStockInputMode,
    movementMetodoPago,
    setMovementMetodoPago,
    esOtroDia,
    setEsOtroDia,
    fechaOtroDia,
    setFechaOtroDia,
    movementQuantity,
    setMovementQuantity,
    movementUnitValue,
    setMovementUnitValue,
    useCustomReason,
    setUseCustomReason,
    movementReason,
    setMovementReason,
    customReason,
    setCustomReason,
    movementError,
    isSubmittingMovement,
    openQuickSale,
    openQuickStock,
    submitMovement,
    resetMovementForm,
  };
}
