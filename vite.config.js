import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_API_URL || "http://localhost:3001";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/login": { target: backend, changeOrigin: true },
        "/token": { target: backend, changeOrigin: true },
        "/usuarios": { target: backend, changeOrigin: true },
        "/padarias": { target: backend, changeOrigin: true },
        "/produtos": { target: backend, changeOrigin: true },
        "/api": { target: backend, changeOrigin: true }, // clientes
        "/entregas": { target: backend, changeOrigin: true },
        "/entregas-avulsas": { target: backend, changeOrigin: true },
        "/rotas": { target: backend, changeOrigin: true },
        "/rota-entregador": { target: backend, changeOrigin: true },
        "/analitico": { target: backend, changeOrigin: true },
      },
    },
  };
});
