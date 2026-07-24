/* Utilidades compartidas por los tests de simuladores. */
import { expect } from "vitest";
import { mulberry32 } from "../../lib/rng.js";

/* rt con RNG sembrado: los sims usan rt.rng, asi que son deterministas. */
export function makeRt(seed = 1) {
  return { data: {}, queue: [], cmds: {}, rng: mulberry32(seed) };
}

/* Corre n pasos. hook(i, rt, estadoActual) permite inyectar comandos. */
export function runN(sim, init, { seed = 1, n = 200, hook } = {}) {
  const rt = makeRt(seed);
  let s = init();
  const states = [];
  for (let i = 0; i < n; i++) {
    if (hook) hook(i, rt, s);
    s = sim(s, 0.5, rt);
    states.push(s);
  }
  return { s, states, rt };
}

/* Verifica que una clave numerica se mantenga en [min, max] en todos los pasos. */
export function expectInRange(states, key, min, max) {
  for (const st of states) {
    const v = st[key];
    expect(typeof v, `${key} deberia ser numero`).toBe("number");
    expect(v, `${key}=${v} fuera de [${min}, ${max}]`).toBeGreaterThanOrEqual(min);
    expect(v, `${key}=${v} fuera de [${min}, ${max}]`).toBeLessThanOrEqual(max);
  }
}

/* Determinismo: dos corridas con la misma semilla producen el mismo estado final. */
export function expectDeterministic(sim, init, opts = {}) {
  const a = runN(sim, init, opts).states;
  const b = runN(sim, init, opts).states;
  expect(JSON.stringify(b)).toBe(JSON.stringify(a));
}
