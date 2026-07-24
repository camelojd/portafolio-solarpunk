import { describe, it, expect } from "vitest";
import { simObra, initObra } from "../obra.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("obra-viva", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simObra, initObra, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simObra, initObra, { n: 400 });
    expectInRange(states, "ppv", 0.2, 55);
    expectInRange(states, "ruido", 40, 112);
    expectInRange(states, "pm10", 12, 320);
    expectInRange(states, "wbgt", 16, 36);
    expectInRange(states, "freat", 2.4, 5.2);
    expectInRange(states, "desp", 0, 40);
  });

  it("responde al comando de pilotadora", () => {
    const { states } = runN(simObra, initObra, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.pile = true; } });
    expect(states[1].pil).toBe(true);
    expect(states[1]._ev.some((m) => m.includes("Pilotadora activada"))).toBe(true);
  });
});
