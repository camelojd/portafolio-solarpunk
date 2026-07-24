import { describe, it, expect } from "vitest";
import { simAlmacen, initAbasto } from "../abasto.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("abasto-vivo", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simAlmacen, initAbasto, { n: 300 }));

  it("mantiene invariantes fisicos de la flota", () => {
    const { states } = runN(simAlmacen, initAbasto, { n: 400 });
    expectInRange(states, "thr", 0, 220);
    expectInRange(states, "errores", 0, 3);
    expectInRange(states, "bat", 0, 100);
    for (const st of states) {
      for (const a of st.amrs) { expect(a.bat).toBeGreaterThanOrEqual(0); expect(a.bat).toBeLessThanOrEqual(100); }
      expect(st.pend).toBeGreaterThanOrEqual(0);
    }
    // raciones despachadas: contador monotono (no se destruye trabajo hecho)
    for (let i = 1; i < states.length; i++) expect(states[i].compl).toBeGreaterThanOrEqual(states[i - 1].compl);
  });

  it("responde al comando de despacho (burst)", () => {
    const { states } = runN(simAlmacen, initAbasto, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.burst = true; } });
    expect(states[1]._ev.some((m) => m.includes("raciones donadas"))).toBe(true);
  });
});
