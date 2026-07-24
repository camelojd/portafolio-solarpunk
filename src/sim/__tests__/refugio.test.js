import { describe, it, expect } from "vitest";
import { simCobot, initRefugio } from "../refugio.js";
import { runN, expectInRange, expectDeterministic } from "./_helpers.js";

describe("refugio-vivo", () => {
  it("es determinista con semilla fija", () => expectDeterministic(simCobot, initRefugio, { n: 300 }));

  it("mantiene invariantes fisicos", () => {
    const { states } = runN(simCobot, initRefugio, { n: 400 });
    expectInRange(states, "confort", 0, 100);
    for (const st of states) {
      for (const r of st.refugios) expect(typeof r.tint).toBe("number");
    }
  });

  it("responde al comando de cambio de material del techo", () => {
    const { states } = runN(simCobot, initRefugio, { n: 3, hook: (i, rt) => { if (i === 1) rt.cmds.maint = true; } });
    expect(states[1].techo).toBe("contenedor"); // arranca en guadua, el comando lo cambia
    expect(states[1]._ev.length).toBeGreaterThan(0);
  });
});
