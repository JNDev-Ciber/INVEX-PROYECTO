import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { ToastProvider } from "@/app/providers/ToastProvider";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { router } from "@/app/routes";
import "@/app/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="invex-theme"
    >
      <QueryProvider>
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Saltar al contenido principal
          </a>

          <main
            id="main-content"
            className="min-h-screen"
            role="main"
            aria-label="Contenido principal"
          >
            <RouterProvider router={router} />
          </main>

          <ToastProvider />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </React.StrictMode>
);
