import { describe, it, expect } from "vitest";
import { simCiclo, initCiclo } from "../ciclo.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("ciclo-obra", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simCiclo, initCiclo, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simCiclo, initCiclo, { n: 500 });
    expectInRange(states, "reciclaje", 0, 100);
    for (const st of states) {
      for (const c of st.cont) { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(100); }
      for (const m of st.mermas) { expect(m).toBeGreaterThanOrEqual(0.5); expect(m).toBeLessThanOrEqual(12); }
      // el material recuperado nunca puede exceder el total procesado (balance de masa)
      expect(st.recRes).toBeLessThanOrEqual(st.totalRes + 1e-9);
    }
  });

  it("responde al comando de recibir lote", () => {
    const { states } = runN(simCiclo, initCiclo, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.lote = true; } });
    expect(states[1]._ev.some((m) => m.includes("Lote recibido"))).toBe(true);
    expect(states[1].recibido).toBeGreaterThan(states[0].recibido);
  });
});
