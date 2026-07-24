import { defineConfig, configDefaults } from "vitest/config";

// Los simuladores son funciones puras: corren en Node, sin DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.js"],
    // Gemelos archivados (fuera del deployment): sus tests siguen en disco
    // pero se excluyen de la corrida.
    exclude: [
      ...configDefaults.exclude,
      "src/sim/__tests__/fibra.test.js",
      "src/sim/__tests__/ciclo.test.js",
    ],
  },
});
