import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/context/auth-context";
import { inicioParaRol } from "@/features/dashboard/sections/registry";

export default function NotFoundPage() {
  const user = useCurrentUser();
  const destino = (user && inicioParaRol(user.rol)) || "/";

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-4">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-4xl font-bold">404</p>
        <p className="text-base font-semibold">Página no encontrada</p>
        <p className="text-sm text-muted-foreground">
          La dirección que abriste no existe o cambió de lugar.
        </p>
      </div>
      <Button asChild>
        <Link to={destino}>Volver al inicio</Link>
      </Button>
    </div>
  );
}
