import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\/(.*)$/, replacement: path.resolve(__dirname, "./src/shared/components/ui") + "/$1" },
      { find: /^@\/components\/tema\/(.*)$/, replacement: path.resolve(__dirname, "./src/shared/components/layout") + "/$1" },
      { find: /^@\/components\/compartidos\/(.*)$/, replacement: path.resolve(__dirname, "./src/shared/components/common") + "/$1" },
      { find: /^@\/components\/auth\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/auth/components") + "/$1" },
      { find: /^@\/components\/dashboard\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/dashboard/components") + "/$1" },
      { find: /^@\/components\/productos\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/productos/components") + "/$1" },
      { find: /^@\/components\/inventario\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/inventario/components") + "/$1" },
      { find: /^@\/components\/facturas\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/facturas/components") + "/$1" },
      { find: /^@\/components\/presupuesto\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/presupuestos/components") + "/$1" },
      { find: /^@\/components\/reportes\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/reportes/components") + "/$1" },
      { find: /^@\/components\/clientes\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/clientes/components") + "/$1" },
      { find: /^@\/components\/precios\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/precios/components") + "/$1" },
      { find: /^@\/components\/ventas\/(.*)$/, replacement: path.resolve(__dirname, "./src/features/ventas/components") + "/$1" },
      { find: /^@\/hooks\/(.*)$/, replacement: path.resolve(__dirname, "./src/shared/hooks") + "/$1" },
      { find: /^@\/lib\/(.*)$/, replacement: path.resolve(__dirname, "./src/shared/lib") + "/$1" },
      { find: /^@\/types\/(.*)$/, replacement: path.resolve(__dirname, "./src/shared/types") + "/$1" },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "./src") + "/$1" },
    ],
  },
  server: {
    port: 3000,
  },
});
