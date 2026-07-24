import { describe, it, expect } from "vitest";
import { simFibra, initFibra } from "../fibra.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("fibra-via", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simFibra, initFibra, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simFibra, initFibra, { n: 400 });
    expectInRange(states, "soc", 0, 100);
    for (const st of states) {
      for (const d of st.det) { expect(d).toBeGreaterThanOrEqual(0); expect(d).toBeLessThanOrEqual(100); }
      expect(st.vehDia).toBeGreaterThanOrEqual(0);
    }
  });

  it("responde al comando de camion (evento discreto en la cola)", () => {
    const { states, rt } = runN(simFibra, initFibra, { n: 3, hook: (i, r) => { if (i === 1) r.cmds.truck = true; } });
    expect(rt.queue.length).toBeGreaterThan(0);
    expect(states[1]._ev.some((m) => m.includes("Camión de prueba"))).toBe(true);
  });
});
