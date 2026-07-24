import { clamp, fmt, hhmm } from "../lib/util.js";

/* Umbrales de decision, cada uno con su norma. Procedencia: docs/supuestos/07-obra-viva.md.
   Este es el gemelo mejor referenciado: todos los umbrales salen de normativa citada. */
export const UMBRALES = {
  ppvAlerta: 25, ppvReset: 22,          // vibracion PPV mm/s (DIN 4150-3)
  ruidoAlerta: 85, ruidoReset: 82,      // Leq dB(A) ocupacional (Res. 1792/1990)
  limComDia: 65, limComNoche: 55,       // ruido comunitario dB(A) (Res. 0627/2006)
  quejaDelta: 12, quejaResetDelta: 8,   // margen sobre el limite comunitario para queja
  pm10Alerta: 150, overSostenido: 2.5,  // PM10 ug/m3 sostenido (Res. 2254/2017)
  despAmarilla: 15, despRoja: 25, despReset: 32, // inclinometro mm/24h (NSR-10 Titulo H)
  wbgtAlerta: 30, wbgtReset: 29,        // indice WBGT grados C (ISO 7243)
};

export function simObra(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const h = (s.hour + dt / 6) % 24;
  const laboral = h > 7 && h < 17;
  let pileT = Math.max(0, s.pileT - dt);
  if (rt.cmds.pile) { rt.cmds.pile = false; pileT = 20; e.push("🔨 Pilotadora activada en frente norte"); }
  if (pileT <= 0 && laboral && R() < dt / 70) pileT = rnd(8, 16);
  const pil = pileT > 0;
  const ppvT = pil ? rnd(20, 34) : laboral ? rnd(3, 9) : rnd(0.4, 1.6);
  const ppv = clamp(s.ppv + (ppvT - s.ppv) * 0.14 + rnd(-0.4, 0.4), 0.2, 55);
  let aV = s.aV;
  if (ppv > U.ppvAlerta && !aV) { aV = true; e.push("⚠ PPV " + fmt(ppv, 1) + " mm/s, supera el umbral DIN 4150-3 en la fachada vecina"); }
  if (ppv < U.ppvReset) aV = false;
  const ruidoT = pil ? rnd(93, 101) : laboral ? rnd(76, 84) : rnd(48, 56);
  const ruido = clamp(s.ruido + (ruidoT - s.ruido) * 0.16 + rnd(-0.5, 0.5), 40, 112);
  let aR = s.aR;
  if (ruido > U.ruidoAlerta && !aR) { aR = true; e.push("🔊 Leq " + fmt(ruido, 1) + " dB(A) sobre 85, toca rotar la cuadrilla (Res. 1792/1990)"); }
  if (ruido < U.ruidoReset) aR = false;
  let aRC = s.aRC;
  const limCom = h > 7 && h < 21 ? U.limComDia : U.limComNoche;
  if (ruido > limCom + U.quejaDelta && !aRC) { aRC = true; e.push("🏘️ Ruido perimetral sobre " + limCom + " dB(A), queda registrada una queja ciudadana"); }
  if (ruido < limCom + U.quejaResetDelta) aRC = false;
  let spray = s.spray - dt, overT = s.overT;
  const pmT = pil ? rnd(190, 250) : laboral ? rnd(95, 145) : rnd(25, 45);
  let pm10 = s.pm10 + (pmT - s.pm10) * 0.07 + rnd(-2, 2);
  overT = pm10 > U.pm10Alerta ? overT + dt : 0;
  if (overT > U.overSostenido && spray <= 0) { spray = 16; overT = 0; e.push("💦 PM10 sostenido sobre 150 µg/m³, arranca la aspersión automática"); }
  if (spray > 0) pm10 -= dt * 14;
  pm10 = clamp(pm10, 12, 320);
  const pm25 = pm10 * 0.42;
  let desp = s.desp, freat = s.freat, lluv = s.lluv - dt;
  if (lluv <= 0 && R() < dt / 90) { lluv = 20; e.push("🌧️ Llueve: el nivel freático sube, vigilar el talud"); }
  freat = clamp(freat + ((lluv > 0 ? 3.1 : 4.6) - freat) * 0.04, 2.4, 5.2);
  desp = clamp(desp + dt * (pil ? 0.42 : 0.1) + (lluv > 0 ? dt * 0.5 : 0) + rnd(-0.05, 0.08), 0, 40);
  let aA = s.aA, aRo = s.aRo;
  if (desp > U.despAmarilla && !aA) { aA = true; e.push("🟡 ALERTA AMARILLA: desplazamiento de " + fmt(desp, 1) + " mm/24 h en inclinómetro I-03"); }
  if (desp > U.despRoja && !aRo) { aRo = true; e.push("✖ ALERTA ROJA: más de 25 mm/24 h, se activa el protocolo de paralización del frente"); }
  if (desp > U.despReset) { desp = 2; aA = false; aRo = false; e.push("✔ Talud estabilizado y anclado, inclinómetro reiniciado"); }
  const wbgtT = laboral ? 24 + Math.max(0, Math.sin((Math.PI * (h - 6)) / 12)) * 10 : 19;
  const wbgt = clamp(s.wbgt + (wbgtT - s.wbgt) * 0.05 + rnd(-0.1, 0.1), 16, 36);
  let aW = s.aW;
  if (wbgt > U.wbgtAlerta && !aW) { aW = true; e.push("🌡️ WBGT " + fmt(wbgt, 1) + " °C, rotación obligatoria (ISO 7243)"); }
  if (wbgt < U.wbgtReset) aW = false;
  const riesgo = clamp((ppv / 50) * 0.3 + (ruido / 100) * 0.2 + (pm10 / 200) * 0.25 + (desp / 25) * 0.25, 0, 1.2);
  return { ...s, hour: h, laboral, pil, pileT, ppv, ruido, pm10, pm25, desp, freat, wbgt, spray, overT, lluv, riesgo,
    aV, aR, aRC, aA, aRo, aW, clock: hhmm(h), _ev: e };
}

export function initObra() {
        return { hour: 9.2, laboral: true, pil: false, pileT: 0, ppv: 5.4, ruido: 79, pm10: 88, pm25: 37, desp: 6.2, freat: 4.3, wbgt: 26.4, spray: -1, overT: 0, lluv: -1, riesgo: 0.3, aV: false, aR: false, aRC: false, aA: false, aRo: false, aW: false, clock: "09:12", _ev: [] };
}
