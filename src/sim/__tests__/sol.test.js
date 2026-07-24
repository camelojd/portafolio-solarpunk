import { describe, it, expect } from "vitest";
import { simSol, initSol } from "../sol.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("sol-terraza", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simSol, initSol, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simSol, initSol, { n: 400 });
    expectInRange(states, "soc", 6, 100);
    expectInRange(states, "nivel", 4, 100);
    expectInRange(states, "ph", 5.1, 7.2);
    expectInRange(states, "ce", 1.35, 2.2);
  });

  it("responde al comando de neblina", () => {
    const { states } = runN(simSol, initSol, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.fog = true; } });
    expect(states[1].fogT).toBeGreaterThan(0);
    expect(states[1]._ev.some((m) => m.includes("Neblina activada"))).toBe(true);
  });

  /* --- Ingesta real via rt.real (pipeline MQTT) --- */
  it("con dato real fresco usa temp/hum/irr del sensor y dispara la alerta termica", () => {
    const { states } = runN(simSol, initSol, {
      n: 4, hook: (_i, rt) => { rt.real = { fresh: true, temp: 31, hum: 55, irr: 200 }; },
    });
    const last = states[states.length - 1];
    expect(last.temp).toBe(31);   // sustituye la relajacion sintetica
    expect(last.hum).toBe(55);
    expect(last.irr).toBe(200);
    expect(last.aT).toBe(true);   // 31 > 28 -> aT -> sev: las plantas reaccionan
  });

  it("con dato obsoleto (fresh=false) vuelve al modelo sintetico", () => {
    const { states } = runN(simSol, initSol, {
      n: 4, hook: (_i, rt) => { rt.real = { fresh: false, temp: 31 }; },
    });
    expect(states[states.length - 1].temp).not.toBe(31);
  });
});
