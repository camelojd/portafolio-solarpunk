import { clamp, fmt, hhmm } from "../lib/util.js";
import { TMY_BOGOTA } from "./data/tmyBogota.js";

/* Muestrea un perfil [mes][hora] del TMY con interpolacion lineal en la hora. */
function sampleTMY(tab, mes, h) {
  const row = tab[((mes % 12) + 12) % 12];
  const i0 = Math.floor(h) % 24;
  const i1 = (i0 + 1) % 24;
  const f = h - Math.floor(h);
  return row[i0] * (1 - f) + row[i1] * f;
}

/* Umbrales de decision. Procedencia: docs/supuestos/09-solar-edificio.md.
   El modelo FV (derrateo, NOCT) y su validacion contra PVGIS estan en docs/09-validacion.md. */
export const UMBRALES = {
  tinAlerta: 27, tinReset: 25.5,        // interior que dispara climatizacion (C). Confort. // TODO: fuente
  socAlerta: 20, socReset: 26,          // autonomia bajo objetivo de 4 h (% SoC). Criterio propio. // TODO: fuente
  balanceResetNeg: -0.3,                // margen para bajar la alerta de balance (kW). Criterio propio.
  achVent: 4.6, achBase: 0.6,           // renovaciones de aire con/sin ventilacion (ACH). Rango tipo NTC 6083.
  irrIlum: 180,                         // irradiancia para encender iluminacion (W/m2). Criterio propio. // TODO: fuente
};

export function simSolarEd(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const real = !!rt.cmds.tmyReal;                 // fuente de irradiancia: TMY real vs sintetica
  const h = (s.hour + dt / 6) % 24;
  const mes = h < s.hour ? (s.mes + 1) % 12 : s.mes; // avanza de mes al cruzar medianoche
  const dayK = Math.max(0, Math.sin((Math.PI * (h - 6)) / 12));
  let nub = s.nub - dt;
  let irr, text;
  if (real) {
    // Irradiancia y temperatura del TMY de Bogota: la nubosidad ya viene en el dato.
    irr = sampleTMY(TMY_BOGOTA.ghi, mes, h);
    text = clamp(sampleTMY(TMY_BOGOTA.temp, mes, h), 0, 35);
  } else {
    if (nub <= 0 && R() < dt / 60) { nub = rnd(6, 14); e.push("☁ Nubosidad sobre la cubierta, la irradiancia cae"); }
    irr = dayK * rnd(880, 1010) * (nub > 0 ? 0.35 : 1);
    text = clamp(9 + dayK * 12 + rnd(-0.2, 0.2), 7, 24);
  }
  let ventT = Math.max(0, s.ventT - dt);
  if (rt.cmds.vent) { rt.cmds.vent = false; ventT = 25; e.push("🪟 Ventanas abiertas: ventilación cruzada 1:1,2"); }
  const vent = ventT > 0;
  const ach = clamp(s.ach + ((vent ? U.achVent : U.achBase) - s.ach) * 0.06, 0.4, 6);
  const tcell = text + (irr / 1000) * 26;   // temp de celda tipo NOCT (subida ~26 C a 1 sol)
  // FV: 12,5 kWp, derrateo -0,35 %/C (tipico c-Si), 97,5 % otras perdidas. Validado vs PVGIS: docs/09-validacion.md
  const fv = clamp((irr / 1000) * 12.5 * (1 - 0.0035 * Math.max(0, tcell - 25)) * 0.975, 0, 13);
  const cargaInt = 2.1 + (h > 7 && h < 19 ? 3.4 : 0.5);
  const tinT = text + (irr / 1000) * 9 + cargaInt * 0.55 - ach * 1.1;
  let tin = s.tin + (tinT - s.tin) * 0.04 + rnd(-0.06, 0.06);
  tin = clamp(tin, 14, 34);
  const clim = clamp(Math.max(0, tin - 24) * 1.9, 0, 8.5);
  const ilum = irr < U.irrIlum ? 1.4 : 0.35;
  const equipos = h > 7 && h < 19 ? 2.2 : 0.6;
  const cons = clim + ilum + equipos;
  const balance = fv - cons;
  let soc = clamp(s.soc + (balance > 0 ? dt * balance * 0.16 : dt * balance * 0.2), 5, 100);
  let aB = s.aB, aT = s.aT, aN = s.aN;
  if (balance > 0 && !aB) { aB = true; e.push("⚡ Balance positivo: el excedente FV carga la batería LFP (Res. 30366/2020)"); }
  if (balance < U.balanceResetNeg && aB) aB = false;
  if (tin > U.tinAlerta && !aT) { aT = true; e.push("🌡️ Interior " + fmt(tin, 1) + " °C, la climatización sube el consumo"); }
  if (tin < U.tinReset) aT = false;
  if (soc < U.socAlerta && !aN) { aN = true; e.push("🔋 SoC bajo 20 %, la autonomía queda por debajo del objetivo de 4 h"); }
  if (soc > U.socReset) aN = false;
  const netoDia = s.netoDia + balance * dt * 0.167;
  return { ...s, hour: h, mes, irr, fv, cons, clim, balance, tin, text, ach, soc, vent, ventT, nub, netoDia, aB, aT, aN, clock: hhmm(h), _ev: e };
}

export function initSolarEd() {
        return { hour: 8.6, mes: 0, irr: 210, fv: 2.4, cons: 3.1, clim: 0.4, balance: -0.7, tin: 21.4, text: 13.2, ach: 0.6, soc: 68, vent: false, ventT: 0, nub: -1, netoDia: -1.2, aB: false, aT: false, aN: false, clock: "08:36", _ev: [] };
}
