import { describe, it, expect } from "vitest";
import { simLinea, initFermenta } from "../fermenta.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("fermenta-viva", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simLinea, initFermenta, { n: 300 }));

  it("mantiene invariantes fisicos del bioproceso", () => {
    const { states } = runN(simLinea, initFermenta, { n: 500 });
    expectInRange(states, "od", 0, 9);
    expectInRange(states, "titulo", 0, 16);
    expectInRange(states, "do2", 5, 100);
    expectInRange(states, "ph", 5.5, 7.6);
    expectInRange(states, "temp", 28, 47);
    // la leche evitada y las vacas nunca decrecen (no se destruye producto)
    for (let i = 1; i < states.length; i++) expect(states[i].lecheF).toBeGreaterThanOrEqual(states[i - 1].lecheF);
  });

  it("responde al comando de contaminacion (aborta el lote a CIP)", () => {
    const { states } = runN(simLinea, initFermenta, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.fault = true; } });
    expect(states[1].contam).toBe(true);
    expect(states[1].fase.indexOf("CIP")).toBe(0);
  });
});
