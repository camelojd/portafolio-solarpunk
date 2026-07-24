import { clamp, mmss } from "../lib/util.js";
import { LLUVIA_KENNEDY } from "./data/lluviaKennedy.js";

/* Origen de la serie real embebida, para etiquetar la fecha que va corriendo. */
const SERIE_BASE_MS = Date.UTC(2024, 9, 1, 0); // 2024-10-01T00 (hora local, tratada como naive)

/* Umbrales de decision. Procedencia: docs/supuestos/10-canal-alerta.md.
   La lluvia de entrada es serie real de IDEAM (ver abajo y docs/10-validacion.md). */
export const UMBRALES = {
  sumidDespeje: 55,         // % de sumideros que dispara la cuadrilla EAAB. Criterio operativo. // TODO: fuente
  humCapacidad: 5200,       // amortiguacion humedal + SUDS (m3). SUDS ref. NS-166 EAAB. // TODO: fuente puntual
  alertaAmarilla: 68, alertaNaranja: 85, alertaRoja: 96, // niveles de alerta (% del canal). Criterio propio (cf. IDIGER). // TODO: fuente
  encharcaLluvia: 22, encharcaSumid: 62, // condicion de encharcamiento en calzada. Criterio propio. // TODO: fuente
};

export function simCanal(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const t = s.t + dt;
  let lluvia = s.lluvia, tormenta = s.tormenta, obst = s.obst, basura = s.basura,
      hum = s.hum, amort = s.amort, cuadrilla = s.cuadrilla, desbordes = s.desbordes;

  if (rt.cmds.storm) { rt.cmds.storm = false; tormenta = 55; e.push("⛈️ Aguacero sobre la cuenca: celda convectiva de 40 mm/h detectada por radar"); }

  // lluvia: por defecto la SERIE HISTORICA REAL de IDEAM (estacion Kennedy, oct-nov 2024).
  // El boton de aguacero la sobreescribe con una celda convectiva sintetica de 40 mm/h que decae.
  const S = LLUVIA_KENNEDY.mmh;
  const idx = Math.floor(t) % S.length;   // avanza ~1 hora de la serie cada 2 pasos del simulador
  if (tormenta > 0) {
    tormenta -= dt;
    lluvia = clamp(lluvia + (40 - lluvia) * clamp(dt * 0.55, 0, 1) + rnd(-1.5, 1.5), 0, 46);
  } else {
    lluvia = clamp(lluvia + (S[idx] - lluvia) * 0.5, 0, 46);
  }
  const ds = new Date(SERIE_BASE_MS + idx * 3600e3);
  const fechaSerie = `${ds.getUTCDate()}/${ds.getUTCMonth() + 1} ${ds.getUTCHours()}h`;

  // sumideros: la basura los tapa; la cuadrilla los despeja bajo el 55 %
  obst = clamp(obst + dt * (0.028 + lluvia * 0.004) - (cuadrilla > 0 ? dt * 2.4 : 0), 0, 78);
  const sumid = 100 - obst;
  if (cuadrilla > 0) { cuadrilla -= dt; if (cuadrilla <= 0) e.push("✔ Cuadrilla EAAB terminó el despeje: sumideros recuperados"); }
  if (sumid < U.sumidDespeje && cuadrilla <= 0) {
    cuadrilla = 9;
    const kg = Math.round(rnd(120, 340));
    basura += kg;
    e.push("🧹 Sumideros bajo 55 % por basura acumulada: cuadrilla de despeje despachada (" + kg + " kg)");
  }

  // hidráulica: lo que los sumideros captan; el humedal y los SUDS amortiguan hasta saturarse
  const captado = lluvia * (sumid / 100) * 0.62;
  const capHum = clamp(1 - hum / U.humCapacidad, 0, 1);
  const aHum = captado * 0.38 * capHum;
  hum = clamp(hum + aHum * dt * 6 - dt * 3.4, 0, U.humCapacidad);
  amort += aHum * dt * 6;
  if (capHum < 0.12 && s.hum / U.humCapacidad <= 0.88) e.push("🌾 Humedal cerca de saturación: la amortiguación natural se agota");

  // lo que los sumideros no captan se queda en la calzada: el problema visible de Bogotá
  if (lluvia > U.encharcaLluvia && sumid < U.encharcaSumid && R() < dt * 0.25) e.push("🌊 Encharcamiento en calzada: los sumideros tapados no captan la escorrentía");

  // canal: entra lo no amortiguado, drena a tasa fija
  const entrada = (captado - aHum) * 0.20;
  const drena = 1.0;
  let nivel = clamp(s.nivel + (entrada - drena) * dt, 4, 100);

  // anticipación al desborde con el ritmo actual (min); acotada, sin división por cero
  const neto = entrada - drena;
  const anticipa = neto > 0.02 ? clamp((100 - nivel) / (neto * 60), 0, 180) : 180;

  // alerta de 4 niveles por umbral de nivel
  const nAl = nivel >= U.alertaRoja ? 3 : nivel >= U.alertaNaranja ? 2 : nivel >= U.alertaAmarilla ? 1 : 0;
  const NOM = ["Verde", "Amarilla", "Naranja", "Roja"];
  if (nAl > s.nAl) {
    if (nAl === 1) e.push("🟡 Alerta AMARILLA: canal al 68 %, vigilancia de puntos críticos");
    if (nAl === 2) e.push("🟠 Alerta NARANJA: canal al 85 %, aviso a Kennedy y Bosa por puntos bajos");
    if (nAl === 3) { e.push("🔴 Alerta ROJA: desborde en punto crítico, protocolo distrital activado"); desbordes += 1; }
  }
  if (nAl < s.nAl && nAl <= 1) e.push("✔ Nivel del canal en descenso: alerta baja a " + NOM[nAl]);

  return { ...s, t, lluvia, tormenta, obst, sumid, basura, hum, amort, cuadrilla, nivel, anticipa,
    nAl, alerta: NOM[nAl], desbordes, fechaSerie, clock: mmss(t), _ev: e };
}

export function initCanal() {
        return { t: 0, lluvia: 2.1, tormenta: 0, obst: 24, sumid: 76, basura: 480, hum: 1650, amort: 12840,
        cuadrilla: 0, nivel: 27.5, anticipa: 180, nAl: 0, alerta: "Verde", desbordes: 0, fechaSerie: "1/10 0h", clock: "00:00", _ev: [] };
}
