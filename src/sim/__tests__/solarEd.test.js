import { describe, it, expect } from "vitest";
import { simSolarEd, initSolarEd } from "../solarEd.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("solar-edificio", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simSolarEd, initSolarEd, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simSolarEd, initSolarEd, { n: 400 });
    expectInRange(states, "soc", 5, 100);
    expectInRange(states, "ach", 0.4, 6);
    expectInRange(states, "tin", 14, 34);
    expectInRange(states, "fv", 0, 13);
    // el balance es exactamente generacion menos consumo (sin energia de la nada)
    for (const st of states) expect(Math.abs(st.balance - (st.fv - st.cons))).toBeLessThan(1e-9);
  });

  it("responde al comando de ventilacion cruzada", () => {
    const { states } = runN(simSolarEd, initSolarEd, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.vent = true; } });
    expect(states[1].vent).toBe(true);
    expect(states[1]._ev.some((m) => m.includes("Ventanas abiertas"))).toBe(true);
  });

  /* --- Modo irradiancia real (TMY Bogota) --- */
  // Genera la energia FV [kWh] de un dia en un mes dado, con o sin TMY real.
  const genDia = (mes, real) => {
    const { states } = runN(simSolarEd, () => ({ ...initSolarEd(), hour: 0, mes }), {
      n: 288, hook: (_i, rt) => { rt.cmds.tmyReal = real; },
    });
    return states.reduce((a, s) => a + s.fv * (0.5 / 6), 0);
  };

  it("modo TMY real es determinista", () =>
    expectDeterministic(simSolarEd, initSolarEd, { n: 300, hook: (_i, rt) => { rt.cmds.tmyReal = true; } }));

  it("con TMY real genera menos que con la irradiancia sintetica (Bogota real es mas nublada)", () => {
    let real = 0, syn = 0;
    for (let m = 0; m < 12; m++) { real += genDia(m, true); syn += genDia(m, false); }
    expect(real).toBeLessThan(syn);
  });

  it("con TMY real aparece estacionalidad; con sintetica no", () => {
    const real = Array.from({ length: 12 }, (_, m) => genDia(m, true));
    const syn = Array.from({ length: 12 }, (_, m) => genDia(m, false));
    const ratio = (a) => Math.max(...a) / Math.min(...a);
    expect(ratio(real)).toBeGreaterThan(1.15); // mes seco vs lluvioso
    expect(ratio(syn)).toBeLessThan(1.05);     // el modelo sintetico es plano todo el anio
  });
});
