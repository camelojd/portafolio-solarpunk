import { describe, it, expect } from "vitest";
import { simCanal, initCanal } from "../canal.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("canal-alerta", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simCanal, initCanal, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simCanal, initCanal, { n: 500 });
    expectInRange(states, "nivel", 4, 100);
    expectInRange(states, "obst", 0, 78);
    expectInRange(states, "lluvia", 0, 46);
    expectInRange(states, "hum", 0, 5200);
    // la capacidad de sumideros es el complemento de la obstruccion
    for (const st of states) expect(Math.abs(st.sumid - (100 - st.obst))).toBeLessThan(1e-9);
  });

  it("responde al comando de aguacero", () => {
    const { states } = runN(simCanal, initCanal, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.storm = true; } });
    expect(states[1].tormenta).toBeGreaterThan(0);
    expect(states[1]._ev.some((m) => m.includes("Aguacero sobre la cuenca"))).toBe(true);
  });

  it("la lluvia la maneja la serie real de IDEAM, no un aleatorio", () => {
    // Sin comando de aguacero, corre hasta cubrir la tormenta real del 2-nov-2024 (idx ~781).
    const { states } = runN(simCanal, initCanal, { n: 1700 });
    const maxLluvia = Math.max(...states.map((s) => s.lluvia));
    expect(maxLluvia).toBeGreaterThan(8); // el pico real de la serie es 20,2 mm/h
    // y expone la fecha real de la serie que va corriendo
    expect(typeof states[states.length - 1].fechaSerie).toBe("string");
  });
});
