import { describe, it, expect } from "vitest";
import { simAqua, initAqua } from "../aqua.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("aqua-serve", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simAqua, initAqua, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simAqua, initAqua, { n: 400 });
    expectInRange(states, "nivel", 2, 100);
    expectInRange(states, "pue", 1.07, 1.36);
    expectInRange(states, "tin", 18, 22);
    expectInRange(states, "turb", 0.2, 0.95);
    expectInRange(states, "cobertura", 0, 200);
    for (const st of states) expect(st.rpm).toBeGreaterThanOrEqual(0);
    // el balance hidrico es exactamente captacion menos demanda (sin agua de la nada)
    for (const st of states) expect(Math.abs(st.balanceHid - (st.captacionDia - st.demandaDia))).toBeLessThan(1e-6);
    // el aporte de las turbinas es anecdotico: siempre bajo 2 % del consumo del datacenter
    for (const st of states) expect(st.turbPct).toBeLessThan(2);
  });

  it("responde al comando de lluvia", () => {
    const { states } = runN(simAqua, initAqua, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.rain = true; } });
    expect(states[1].rainTgt).toBeGreaterThan(0);
    expect(states[1]._ev.some((m) => m.includes("evento de lluvia"))).toBe(true);
  });
});
