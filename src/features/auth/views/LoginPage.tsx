import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Login } from "@/features/auth/components/login";
import { useAuth } from "@/features/auth/context/auth-context";
import { useAuthHydration } from "@/app/stores/auth.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const isHydrated = useAuthHydration();

  useEffect(() => {
    if (isHydrated && user) {
      const initialPath =
        user.rol === "vendedor" ? "/venta-rapida" : "/dashboard";
      navigate(initialPath, { replace: true });
    }
  }, [isHydrated, user, navigate]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-md">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <p className="text-sm font-medium text-foreground">INVEX</p>
          <div className="flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <Login
      onLogin={(u) => {
        const authUser = { id: u.id, username: u.username, rol: u.rol };
        login(authUser);
        const initialPath =
          authUser.rol === "vendedor" ? "/venta-rapida" : "/dashboard";
        navigate(initialPath, { replace: true });
      }}
    />
  );
}
