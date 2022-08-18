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
    //This is necessary to import assets correctly. Oterwise, the path will be wrong, since the codes will be transpled to .vite folder.
    exclude: ["euler-engine", "euler-tex"],
    esbuildOptions: { target: "es2020" },
  },
} as UserConfigExport);
