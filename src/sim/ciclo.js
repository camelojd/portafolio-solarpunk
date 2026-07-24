import { clamp, fmt, mmss } from "../lib/util.js";

/* Umbrales de decision (mismos valores que antes, ahora nombrados) */
export const UMBRALES = {
  mermaLim: [5, 3, 8, 5],               // limite de merma vs APU: agregados, acero, concreto, mamposteria (%)
  mermaResetDelta: 0.6,                 // margen para bajar la alerta de merma
  contLleno: 100,                       // % de llenado que dispara el despacho
  // aprovechamiento por corriente (metales, escombros, plasticos, organicos)
  aprovMetales: 0.96, aprovEscombros: 0.78, aprovPlasticos: 0.62, aprovOrganicos: 0.85,
};

export function simCiclo(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const t = s.t + dt;
  let recibido = s.recibido, cont = s.cont.slice(), truck = s.truck, truckS = s.truckS;
  let reciclaje = s.reciclaje, ahorro = s.ahorro, co2 = s.co2, totalRes = s.totalRes, recRes = s.recRes;
  const nombres = ["escombros", "metales", "plásticos", "orgánicos"];
  if (rt.cmds.lote) {
    rt.cmds.lote = false;
    const kg = rnd(1.8, 4.2);
    recibido += kg;
    e.push("📦 Lote recibido: " + fmt(kg, 1) + " t · RFID leído · báscula ±0,5 kg");
  }
  if (R() < dt / 22) { const kg = rnd(0.6, 2.4); recibido += kg; }
  const mermas = s.mermas.map((m) => clamp(m + rnd(-0.06, 0.07), 0.5, 12));
  const lim = U.mermaLim;
  let aM = s.aM.slice();
  ["agregados", "acero de refuerzo", "concreto", "mampostería"].forEach((n, i) => {
    if (mermas[i] > lim[i] && !aM[i]) { aM[i] = true; e.push("⚠ Merma de " + n + " en " + fmt(mermas[i], 1) + " %, por encima del " + lim[i] + " % que fija el APU"); }
    if (mermas[i] < lim[i] - U.mermaResetDelta) aM[i] = false;
  });
  const merma = mermas.reduce((a, b) => a + b, 0) / 4;
  for (let i = 0; i < 4; i++) cont[i] = clamp(cont[i] + dt * rnd(0.5, 1.5) * (i === 0 ? 1.5 : 0.7), 0, 100);
  const fullIdx = cont.findIndex((c) => c >= U.contLleno);
  if (fullIdx >= 0 && truck < 0) {
    truck = fullIdx;
    truckS = 0;
    const tn = rnd(1.1, 2.6);
    totalRes += tn;
    const aprov = fullIdx === 1 ? U.aprovMetales : fullIdx === 0 ? U.aprovEscombros : fullIdx === 2 ? U.aprovPlasticos : U.aprovOrganicos;
    recRes += tn * aprov;
    ahorro += tn * rnd(70, 140);
    co2 += tn * (fullIdx === 0 ? 0.032 : 0.018);
    cont[fullIdx] = 4;
    e.push("🚛 Contenedor de " + nombres[fullIdx] + " lleno → gestor autorizado (" + fmt(tn, 1) + " t)");
  }
  if (truck >= 0) {
    truckS += dt * 0.18;
    if (truckS >= 1) {
      e.push("⛓️ Cadena de custodia firmada en Polygon · certificado de aprovechamiento emitido");
      truck = -1;
      truckS = 0;
    }
  }
  reciclaje = totalRes > 0 ? (recRes / totalRes) * 100 : 0;
  const resid = cont.reduce((a, b) => a + b, 0) / 4;
  return { ...s, t, recibido, mermas, merma, cont, resid, truck, truckS, totalRes, recRes, reciclaje, ahorro, co2, aM, clock: mmss(t), _ev: e };
}

export function initCiclo() {
        return { t: 0, recibido: 128.4, mermas: [4.2, 2.4, 6.8, 3.9], merma: 4.3, cont: [62, 28, 45, 18], resid: 38, truck: -1, truckS: 0, totalRes: 84.2, recRes: 61.5, reciclaje: 73, ahorro: 8420, co2: 2.14, aM: [false, false, false, false], clock: "00:00", _ev: [] };
}
