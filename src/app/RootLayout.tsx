import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/features/dashboard/components/AppShell";

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-md">
          <span className="text-primary-foreground font-extrabold text-lg">I</span>
        </div>
        <p className="text-sm font-medium text-foreground">INVEX</p>
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function RootLayout() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}
