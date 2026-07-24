import { clamp, hhmm } from "../lib/util.js";

/* Umbrales de decision (mismos valores que antes, ahora nombrados) */
export const UMBRALES = {
  socPrioriza: 25, socReset: 30,       // se priorizan luminarias bajo este SoC (%)
  detAmarillo: 60,                     // deterioro de segmento que pasa a AMARILLO (%)
};

export function simFibra(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const prevHour = s.hour;
  const h = (s.hour + dt / 6) % 24;
  const lum = h < 5.7 || h > 18.2;
  let vehDia = s.vehDia, volt = s.volt * 0.94, eDia = s.eDia, soc = s.soc;
  const det = s.det.slice();
  const pushVeh = (clase) => {
    rt.queue.push({ clase, dir: R() < 0.5 ? 1 : -1 });
    vehDia += 1;
    const vv = clase === "pesado" ? rnd(80, 120) : clase === "liviano" ? rnd(35, 65) : rnd(15, 30);
    volt = vv;
    eDia += vv * 0.018;
    soc = clamp(soc + (clase === "pesado" ? 0.25 : 0.08), 0, 100);
    if (clase === "pesado") { const gi = 2 + Math.floor(R() * 6); det[gi] = clamp(det[gi] + rnd(0.25, 0.6), 0, 100); }
  };
  if (rt.cmds.truck) { rt.cmds.truck = false; pushVeh("pesado"); e.push("🚛 Camión de prueba (eje 13 t) enviado a la vía"); }
  if (R() < dt * 0.55) { const r = R(); pushVeh(r < 0.3 ? "moto" : r < 0.82 ? "liviano" : "pesado"); }
  if (h < prevHour) { vehDia = 0; eDia = 0; e.push("🕛 Medianoche, contadores diarios en cero"); }
  if (lum) soc = clamp(soc - dt * 0.22, 0, 100);
  let aS = s.aS;
  if (soc < U.socPrioriza && !aS) { aS = true; e.push("🔋 Baterías LFP bajo 25 %, se priorizan las luminarias"); }
  if (soc > U.socReset) aS = false;
  const detMax = Math.max(...det);
  let aY = s.aY;
  if (detMax > U.detAmarillo && !aY) { aY = true; const idx = det.indexOf(detMax); e.push("🟡 Segmento " + (idx + 1) + " en estado AMARILLO, hay que programar inspección"); }
  return { ...s, hour: h, lum, vehDia, volt, eDia, soc, det, detMax, aS, aY, clock: hhmm(h), _ev: e };
}

export function initFibra() {
        return { hour: 17.3, lum: false, vehDia: 87, volt: 0, eDia: 64.2, soc: 58, det: [8, 12, 18, 9, 26, 14, 57, 11, 21, 7], detMax: 57, aS: false, aY: false, clock: "17:18", _ev: [] };
}
