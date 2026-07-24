import { clamp, fmt, mmss } from "../lib/util.js";

/* Umbrales de decision. Gemelo ilustrativo (nivel C): todos son criterios propios de
   demostracion, sin fuente externa. Procedencia: docs/supuestos/06-abasto-vivo.md. */
export const UMBRALES = {
  batRecargado: 96, batBajo: 20,        // recarga automatica del AMR (% bateria). Criterio propio. // TODO: fuente
  thrMeta: 150, thrReset: 158,          // meta de despacho (raciones/h). Criterio propio. // TODO: fuente
  backlogAlerta: 180, backlogReset: 120,// backlog que sugiere sumar turno. Criterio propio. // TODO: fuente
  vencerAlerta: 5, vencerReset: 3,      // lotes en riesgo de vencer (FEFO). Criterio propio. // TODO: fuente
};

export function simAlmacen(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const t = s.t + dt;
  let pend = s.pend, compl = s.compl, errores = s.errores, blocked = s.blocked - dt;
  let kgF = s.kgF !== undefined ? s.kgF : compl;
  if (rt.cmds.burst) { rt.cmds.burst = false; pend += 100; e.push("🍞 Llegan 100 raciones donadas a la flota · replanificando por FEFO"); }
  if (rt.cmds.block) { rt.cmds.block = false; blocked = 30; e.push("📍 Pasillo B bloqueado: los AMRs recalculan por ruta alterna"); }
  if (R() < dt / 8) pend += Math.round(rnd(1, 4));
  const blk = blocked > 0;
  const amrs = s.amrs.map((a) => {
    const r = { ...a };
    if (r.charging) {
      r.bat = clamp(r.bat + dt * 9, 0, 100);
      if (r.bat >= U.batRecargado) { r.charging = false; r.phase = 0; r.s = 0; e.push("🔋 AMR-" + r.id + " recargado al 96 %, vuelve a la flota"); }
      return r;
    }
    const spd = blk ? 0.2 : 0.3;
    r.s += dt * spd;
    r.bat = clamp(r.bat - dt * 0.24, 0, 100);
    if (r.bat < U.batBajo && !r.charging) { r.charging = true; e.push("🪫 AMR-" + r.id + " bajo 20 %, sale a la estación de carga"); return r; }
    if (r.s >= 1) {
      r.s = 0;
      r.phase = 1 - r.phase;
      if (r.phase === 0) {
        if (pend > 0) {
          pend -= 1;
          compl += 1;
          kgF += rnd(2, 6);
          if (R() < 0.004) { errores = clamp(errores + 0.05, 0, 3); e.push("❌ Error de picking en AMR-" + r.id + ", la caja se rechaza al verificar el barcode"); }
        }
        r.rack = Math.floor(rnd(0, 3));
      }
    }
    return r;
  });
  const activos = amrs.filter((a) => !a.charging).length;
  errores = clamp(errores - dt * 0.004, 0, 3);
  const thrT = activos * (blk ? 22 : 34) * (pend > 0 ? 1 : 0.25);
  const thr = clamp(s.thr + (thrT - s.thr) * 0.05, 0, 220);
  const ciclo = thr > 5 ? clamp(3600 / thr, 8, 200) : 200;
  const bat = amrs.reduce((a, b) => a + b.bat, 0) / amrs.length;
  const kg = Math.floor(kgF);
  const vencer = clamp(Math.round(pend / 22 + (blk ? 1.5 : 0)), 0, 9);
  let aT = s.aT, aB = s.aB, aV = s.aV;
  if (thr < U.thrMeta && !aT) { aT = true; e.push("📉 Despacho en " + fmt(thr, 0) + " raciones/h, bajo la meta de 150"); }
  if (thr > U.thrReset) aT = false;
  if (pend > U.backlogAlerta && !aB) { aB = true; e.push("📚 Backlog de " + pend + " lotes acumulados, conviene sumar un turno de voluntarios"); }
  if (pend < U.backlogReset) aB = false;
  if (vencer >= U.vencerAlerta && !aV) { aV = true; e.push("⏳ " + vencer + " lotes en riesgo de vencer sin despachar, la flota prioriza los más próximos a caducar"); }
  if (vencer < U.vencerReset) aV = false;
  return { ...s, t, amrs, pend, compl, thr, ciclo, activos, bat, errores, kgF, kg, vencer, blocked, blk, aT, aB, aV, clock: mmss(t), _ev: e };
}

export function initAbasto() {
        return { t: 0, amrs: [0, 1, 2, 3, 4].map((i) => ({ id: i + 1, s: i / 5, phase: i % 2, rack: i % 3, bat: 60 + i * 8, charging: false })),
        pend: 42, compl: 1284, thr: 162, ciclo: 22.2, activos: 5, bat: 76, errores: 0.12, kg: 4820, kgF: 4820, vencer: 3, blocked: -1, blk: false, aT: false, aB: false, aV: false, clock: "00:00", _ev: [] };
}
