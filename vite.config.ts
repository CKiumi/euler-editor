/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig, UserConfigExport } from "vite";
import { configDefaults } from "vitest/config";

export default defineConfig({
  //This is necessary to import euler-engine for vitest
  resolve: {
    mainFields: ["fesm2020", "fesm2015", "module"],
  },
  test: {
    environment: "happy-dom",
    exclude: [...configDefaults.exclude, "test/e2e/*"],
    coverage: { reportsDirectory: "test/coverage" },
  },
  optimizeDeps: {
    exclude: ["euler-engine"],
    esbuildOptions: { target: "es2020" },
  },
} as UserConfigExport);
