import { clamp, fmt, mmss } from "../lib/util.js";

/* Umbrales de decision. Procedencia detallada: docs/supuestos/02-aqua-serve.md.
   El balance hidrico (WUE, escorrentia) esta citado en docs/02-tesis.md; estos son umbrales operativos. */
export const UMBRALES = {
  tcpuAlerta: 80, tcpuReset: 76,       // throttling termico tipico de GPU de datacenter (~80-90 C). // TODO: fuente puntual
  coolMin: 10,                         // circulacion DLC si nivel > coolMin (%). Criterio operativo. // TODO: fuente
  nivelAlarma: 20, nivelReset: 26,     // alarma de nivel del deposito (%). Criterio operativo. // TODO: fuente
  nivelCorteDLC: 10, nivelResetDLC: 14, // corte de circulacion DLC (%). Criterio operativo. // TODO: fuente
};

export function simAqua(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const t = s.t + dt;
  let rainTgt = s.rainTgt, rainT = s.rainT - dt;
  if (rt.cmds.rain) { rt.cmds.rain = false; rainTgt = rnd(20, 38); rainT = rnd(22, 30); e.push("🌧️ Comando recibido: evento de lluvia (" + fmt(rainTgt, 0) + " mm/h)"); }
  if (rainT <= 0) {
    if (rainTgt > 0) { rainTgt = 0; e.push("☀ Paró la lluvia, las turbinas se detienen"); }
    else if (R() < dt / 75) { rainTgt = rnd(8, 30); rainT = rnd(15, 28); e.push("🌧️ Lluvia natural detectada en cubierta"); }
  }
  let rain = s.rain + ((rainT > 0 ? rainTgt : 0) - s.rain) * 0.08;
  if (rain < 0.2) rain = 0;
  const caudal = rain > 0 ? clamp(rain / 8 + rnd(-0.08, 0.08), 0, 5) : 0;
  const rpmT = caudal > 0.15 ? clamp(55 + caudal * 26, 0, 182) : 0;
  const rpm = s.rpm + (rpmT - s.rpm) * 0.1;
  const pot = rpm > 5 ? Math.max(0, 4 * (15 + 30 * clamp(caudal / 5, 0, 1)) + rnd(-4, 4)) : 0;
  const load = clamp(58 + 34 * Math.sin(t / 21) + rnd(-3, 3), 18, 96);
  const coolOK = s.nivel > U.coolMin;
  const tTgt = coolOK ? 45 + 0.36 * load : 45 + 0.6 * load;
  let tcpu = s.tcpu + (tTgt - s.tcpu) * 0.05 + rnd(-0.2, 0.2);
  let aT = s.aT;
  if (tcpu > U.tcpuAlerta && !aT) { aT = true; e.push("🔥 CPU " + fmt(tcpu, 0) + " °C, alerta térmica en racks"); }
  if (tcpu < U.tcpuReset) aT = false;
  const tin = clamp(s.tin + rnd(-0.05, 0.05), 18, 22);
  const tout = tin + 10 + (2 * load) / 100;
  const nivel = clamp(s.nivel + rain * 0.045 * dt - dt * (0.05 + load * 0.0012), 2, 100);
  let aN = s.aN, aC2 = s.aC2;
  if (nivel < U.nivelAlarma && !aN) { aN = true; e.push("⚠ Depósito bajo 20 %, alarma de nivel"); }
  if (nivel > U.nivelReset) aN = false;
  if (nivel < U.nivelCorteDLC && !aC2) { aC2 = true; e.push("✖ Nivel bajo 10 %, se corta la circulación DLC"); }
  if (nivel > U.nivelResetDLC) aC2 = false;
  const turb = clamp(s.turb + rnd(-0.03, 0.03), 0.2, 0.95);
  const pue = clamp(1.085 + 0.005 * (tcpu - 45) - pot * 0.00035 + rnd(-0.004, 0.004), 1.07, 1.36);

  // === Eje principal: balance hidrico (litros). Las turbinas son un detalle anecdotico. ===
  // Supuestos de escala, documentados y citados en docs/02-tesis.md:
  //   AG.area  cubierta de captacion (m2) · AG.escorr coef. escorrentia (cubierta dura)
  //   AG.ptiKW capacidad TI nominal (kW) · AG.wue Water Usage Effectiveness (L por kWh de TI)
  const AG = { area: 2000, escorr: 0.8, ptiKW: 300, wue: 1.0 };
  const itKW = (load / 100) * AG.ptiKW;                       // carga TI instantanea (kW)
  const consumoW = itKW * pue * 1000;                         // consumo electrico total del DC (W)
  const capLh = rain * AG.area * AG.escorr;                   // captacion pluvial instantanea: 1 mm sobre 1 m2 = 1 L (L/h)
  const capEMA = s.capEMA + (capLh - s.capEMA) * 0.012;       // media rodante (L/h) -> base diaria estable frente a la lluvia spiky
  const captacionDia = capEMA * 24;                           // L/dia captados (estimador rodante)
  const demandaDia = itKW * 24 * AG.wue;                      // L/dia de agua que demanda el enfriamiento
  const balanceHid = captacionDia - demandaDia;               // L/dia neto (KPI principal)
  const cobertura = demandaDia > 0 ? clamp((captacionDia / demandaDia) * 100, 0, 200) : 0; // % de demanda cubierto por lluvia
  const turbPct = consumoW > 0 ? (pot / consumoW) * 100 : 0;  // aporte de las turbinas vs consumo total (anecdotico)

  return { ...s, t, rain, rainTgt, rainT, caudal, rpm, pot, load, tcpu, tin, tout, nivel, turb, pue, coolOK, aT, aN, aC2,
    itKW, consumoW, capEMA, captacionDia, demandaDia, balanceHid, cobertura, turbPct, clock: mmss(t), _ev: e };
}

export function initAqua() {
        return { t: 0, rain: 0, rainTgt: 22, rainT: 18, caudal: 0, rpm: 0, pot: 0, load: 60, tcpu: 56, tin: 20, tout: 31, nivel: 62, turb: 0.5, pue: 1.22, coolOK: true, aT: false, aN: false, aC2: false,
        itKW: 180, consumoW: 216000, capEMA: 150, captacionDia: 3600, demandaDia: 4320, balanceHid: -720, cobertura: 83, turbPct: 0, clock: "00:00", _ev: [] };
}
