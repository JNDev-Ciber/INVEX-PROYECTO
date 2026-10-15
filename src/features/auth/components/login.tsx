import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, User, KeyRound, Loader2 } from "lucide-react";
import { useLogin } from "@/features/auth/hooks/useLogin";

export function Login({
  onLogin,
}: {
  onLogin: (user: { id: string | number; username: string; rol: string }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin();

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await loginMutation.mutateAsync({ username, password });
      onLogin(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Usuario o contraseña incorrectos.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">
              Iniciar sesión
            </h1>
            <p className="text-sm text-muted-foreground">INVEX</p>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <form onSubmit={handleCredentials} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="username"
                className="block mb-1.5 text-sm font-medium text-foreground"
              >
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                  autoComplete="username"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block mb-1.5 text-sm font-medium text-foreground"
              >
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-9"
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} ElectroluxStore
        </p>
      </div>
    </div>
  );
}
