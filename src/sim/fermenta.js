import { clamp, fmt, mmss } from "../lib/util.js";

/* Maquina de estados ISA-88 (IEC 61512): la ESTRUCTURA por fases sigue el estandar real.
   Los setpoints y duraciones son valores de proceso plausibles, no medidos; la cinetica real
   (Monod) esta pendiente (T5). Procedencia detallada: docs/supuestos/05-fermenta-viva.md.
   // TODO: fuente de setpoints y duraciones por fase (fermentacion de precision) */
export const BIO_ORDER = ["Inoculación", "Crecimiento", "Producción", "Cosecha", "CIP (limpieza)"];
export const BIO_DUR = { "Inoculación": 8, "Crecimiento": 25, "Producción": 30, "Cosecha": 9, "CIP (limpieza)": 12 };
export const BIO_TGT = {
  "Inoculación": { od: 0.6, tit: 0, do2: 92, feed: 0.1, ph: 7.0, temp: 31 },
  "Crecimiento": { od: 6.5, tit: 0.5, do2: 28, feed: 0.5, ph: 6.7, temp: 31 },
  "Producción": { od: 7.2, tit: 12, do2: 34, feed: 0.9, ph: 6.8, temp: 31 },
  "Cosecha": { od: 6.6, tit: 12, do2: 42, feed: 0.2, ph: 6.9, temp: 30 },
  "CIP (limpieza)": { od: 0.2, tit: 0, do2: 96, feed: 0, ph: 7.2, temp: 45 },
};

/* Umbrales de decision. Procedencia: docs/supuestos/05-fermenta-viva.md. */
export const UMBRALES = {
  litrosPorGL: 42,          // L de leche equivalente por g/L de titulo. Equivalencia ilustrativa. // TODO: fuente
  litrosPorVaca: 7500,      // L de leche/vaca/ano. Promedio lechero. // TODO: fuente (Fedegan/USDA)
  odBuenCrecimiento: 6,     // OD600 de buen crecimiento. Criterio propio. // TODO: fuente
  penalizaContam: 4,        // g/L perdidos al contaminar. Criterio propio. // TODO: fuente
  probContamProd: 1 / 140,  // prob. de contaminacion espontanea por dt. Criterio propio. // TODO: fuente
};

export function simLinea(s, dt, rt) {
  const R = rt.rng || Math.random;
  const rnd = (a, b) => a + R() * (b - a);
  const U = UMBRALES;
  const e = [];
  const t = s.t + dt;
  let fase = s.fase, faseT = s.faseT - dt, contam = s.contam, lote = s.lote, lecheF = s.lecheF;
  let od = s.od, titulo = s.titulo, ph = s.ph, do2 = s.do2, temp = s.temp, feed = s.feed;

  if (rt.cmds.fault) {
    rt.cmds.fault = false;
    if (fase !== "CIP (limpieza)") {
      contam = true; fase = "CIP (limpieza)"; faseT = BIO_DUR[fase]; titulo = Math.max(0, titulo - U.penalizaContam);
      e.push("🧫 Contaminación detectada (subida de CO2 y caída de DO). El lote aborta y pasa a CIP (ISA-88)");
    }
  }
  if (!contam && fase === "Producción" && R() < dt * U.probContamProd) {
    contam = true; fase = "CIP (limpieza)"; faseT = BIO_DUR[fase];
    e.push("🧫 Contaminación espontánea en producción, se sacrifica el lote y arranca la limpieza CIP");
  }

  if (faseT <= 0) {
    const idx = BIO_ORDER.indexOf(fase);
    const next = BIO_ORDER[(idx + 1) % BIO_ORDER.length];
    if (fase === "Cosecha" && !contam) {
      const rendido = titulo * U.litrosPorGL;
      lecheF += rendido;
      e.push("✔ Cosecha del lote #" + lote + ": " + fmt(titulo, 1) + " g/L de proteína, equivale a " + fmt(rendido, 0) + " L de leche animal no necesarios");
    }
    if (next === "Inoculación") { lote += 1; contam = false; e.push("🌱 Inoculación del lote #" + lote + ": siembro el biorreactor con el cultivo"); }
    if (next === "Producción") e.push("🧪 Inducción: el cultivo entra en fase de producción de proteína");
    fase = next; faseT = BIO_DUR[fase];
  }

  const g = BIO_TGT[fase] || BIO_TGT["Crecimiento"];
  const k = clamp(dt * 0.5, 0, 1);
  od = clamp(od + (g.od - od) * k + rnd(-0.03, 0.03), 0, 9);
  titulo = clamp(titulo + (g.tit - titulo) * k * 0.6 + rnd(-0.02, 0.02), 0, 16);
  do2 = clamp(do2 + (g.do2 - do2) * k + rnd(-0.6, 0.6), 5, 100);
  ph = clamp(ph + (g.ph - ph) * k + rnd(-0.01, 0.01), 5.5, 7.6);
  temp = clamp(temp + (g.temp - temp) * k + rnd(-0.06, 0.06), 28, 47);
  feed = clamp(feed + (g.feed - feed) * k, 0, 1);

  const leche = Math.floor(lecheF);
  const vacas = Math.floor(leche / U.litrosPorVaca);
  if (s.od < U.odBuenCrecimiento && od >= U.odBuenCrecimiento && fase === "Crecimiento") e.push("📈 Biomasa en OD " + fmt(od, 1) + ", el cultivo creció bien");

  return { ...s, t, fase, faseT, od, titulo, ph, do2, temp, feed, contam, lote, lecheF, leche, vacas, clock: mmss(t), _ev: e };
}

export function initFermenta() {
        return { t: 0, fase: "Crecimiento", faseT: 22, od: 2.1, titulo: 1.2, ph: 6.85, do2: 46, temp: 31.2, feed: 0.32,
        contam: false, lote: 7, lecheF: 0, leche: 0, vacas: 0, clock: "00:00", _ev: [] };
}
