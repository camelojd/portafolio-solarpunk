import { clamp, fmt, hhmm } from "../lib/util.js";

/* Umbrales de decision. Procedencia detallada: docs/supuestos/01-sol-terraza.md.
   Los rangos son coherentes con guias de hidroponia de hoja pero sin cita puntual verificada. */
export const UMBRALES = {
  tempAlerta: 28, tempReset: 27,       // riesgo de quema foliar (C). // TODO: fuente (agronomia de hoja)
  phMin: 5.5, phReset: 5.9,            // pH bajo dispara KOH; hoja ~5,5-6,5. // TODO: fuente
  ceMin: 1.5, ceMax: 2.0, ceResetLo: 1.55, ceResetHi: 1.95, // CE de hoja 1,5-2,0 mS/cm. // TODO: fuente
  nivelMin: 20, nivelReset: 45,        // valvula de red (% deposito). Criterio operativo propio. // TODO: fuente
  socAhorro: 30, socReset: 34,         // modo ahorro (% SoC). Criterio de gestion propio. // TODO: fuente
  irrCarga: 150, irrLed: 130,          // carga FV / luz artificial (W/m2). Criterio propio. // TODO: fuente
};

export function simSol(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const h = (s.hour + dt / 6) % 24;
  const day = h > 6 && h < 18;
  let irr = day ? Math.max(0, Math.sin((Math.PI * (h - 6)) / 12)) * rnd(880, 1000) : 0;
  let fogT = Math.max(0, s.fogT - dt);
  if (rt.cmds.fog) { rt.cmds.fog = false; fogT = 22; e.push("🌫️ Neblina activada: la malla raschel ya está capturando agua"); }
  const fog = fogT > 0 || (h > 4 && h < 7.5);
  let spike = s.spike - dt;
  if (spike <= 0 && R() < dt / 55) spike = rnd(6, 10);
  const tTgt = 15 + (irr / 1000) * 8 + (spike > 0 ? 7 : 0);
  let temp = s.temp + (tTgt - s.temp) * 0.06 + rnd(-0.12, 0.12);
  // Humedad del aire: proxy derivado (inverso a temp, sube con neblina). Sin rng: no altera el determinismo sintetico.
  let hum = clamp(88 - (temp - 15) * 2.6 + (fog ? 6 : 0), 35, 99);
  // Ingesta real (rt.real): los sensores fisicos sustituyen los canales medidos. Aguas abajo (aT, sev) reaccionan al dato real.
  if (rt.real && rt.real.fresh) {
    temp = rt.real.temp;
    if (typeof rt.real.irr === "number") irr = rt.real.irr;
    if (typeof rt.real.hum === "number") hum = rt.real.hum;
  }
  let aT = s.aT;
  if (temp > U.tempAlerta && !aT) { aT = true; e.push("⚠ Temperatura " + fmt(temp, 1) + " °C, hay riesgo de quema foliar"); }
  if (temp < U.tempReset) aT = false;
  let phEvent = s.phEvent - dt;
  let ph = s.ph + rnd(-0.015, 0.012);
  if (phEvent <= 0 && R() < dt / 60) phEvent = 14;
  if (phEvent > 0) ph -= 0.09 * dt;
  let aP = s.aP;
  if (ph < U.phMin && !aP) { aP = true; e.push("⚠ pH " + fmt(ph, 2) + ", dosificando KOH automáticamente"); }
  if (aP) { ph += 0.12 * dt; if (ph > U.phReset) { aP = false; phEvent = 0; e.push("✔ pH estabilizado en " + fmt(ph, 2)); } }
  ph = clamp(ph, 5.1, 7.2);
  const ce = clamp(s.ce + rnd(-0.02, 0.02), 1.35, 2.2);
  let aC = s.aC;
  if ((ce < U.ceMin || ce > U.ceMax) && !aC) { aC = true; e.push("⚠ CE " + fmt(ce, 2) + " mS/cm fuera de rango para cultivo de hoja"); }
  if (ce > U.ceResetLo && ce < U.ceResetHi) aC = false;
  let nivel = s.nivel - dt * 0.28 + (fog ? dt * 0.9 : 0);
  let aN = s.aN;
  if (nivel < U.nivelMin && !aN) { aN = true; e.push("🚰 Nivel bajo 20 %, se abre la válvula de red"); }
  if (aN) { nivel += dt * 2.2; if (nivel > U.nivelReset) { aN = false; e.push("✔ Depósito recuperado, válvula de red cerrada"); } }
  nivel = clamp(nivel, 4, 100);
  let soc = clamp(s.soc + (irr > U.irrCarga ? dt * 0.55 : -dt * 0.4), 6, 100);
  let aS = s.aS;
  if (soc < U.socAhorro && !aS) { aS = true; e.push("🔋 SoC bajo 30 %, entrando en modo ahorro"); }
  if (soc > U.socReset) aS = false;
  const led = irr < U.irrLed && soc > 12;
  const sev = aT && (aP || aC) ? 1 : aT || aP || aC ? 0.55 : 0;
  return { ...s, hour: h, irr, temp, hum, ph, ce, nivel, soc, fogT, spike, phEvent, aT, aP, aC, aN, aS, led, fog, sev, clock: hhmm(h), _ev: e };
}

export function initSol() {
        return { hour: 7.4, temp: 19.5, hum: 72, ph: 6.1, ce: 1.72, nivel: 78, irr: 0, soc: 64, fogT: 0, spike: 0, phEvent: 20, aT: false, aP: false, aC: false, aN: false, aS: false, led: false, fog: true, sev: 0, clock: "07:24", _ev: [] };
}
