/* ================================================================
   Validacion del gemelo 09 SOLAR-EDIFICIO contra irradiancia real.

   Compara, mes a mes:
     - Generacion FV ESPERADA: modelo de panel del simulador alimentado
       con la irradiancia horaria real (PVGIS TMY de Bogota).
     - Generacion FV MODELADA: el simulador actual (simSolarEd) con su
       irradiancia sintetica (sinusoide fijo + nubosidad aleatoria).

   No inventa numeros: todo sale del CSV real y del propio simulador.
   Reproducible:  node scripts/validar-solar.mjs

   Salida: tabla en stdout + docs/09-validacion-datos.json
   ================================================================ */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { simSolarEd, initSolarEd } from "../src/sim/solarEd.js";
import { mulberry32 } from "../src/lib/rng.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/* --- Especificacion del panel: los mismos coeficientes que solarEd.js.
   Si cambian alli, deben cambiar aqui. Fuente: solarEd.js lineas 27-28. --- */
const PANEL = {
  kWp: 12.5,          // potencia pico nominal
  tempCoef: 0.0035,   // derrateo -0,35 %/grado C sobre 25 C
  otras: 0.975,       // otras perdidas (cableado, inversor, suciedad)
  noctRise: 26,       // subida de temp de celda a 1 sol (tipo NOCT)
  capKW: 13,          // tope fisico de salida
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Modelo de panel: irradiancia [W/m2] + temp aire [C] -> potencia FV [kW].
   Identico al del simulador; aqui se alimenta con el dato real. */
function fvKW(irr, tAire) {
  const tcell = tAire + (irr / 1000) * PANEL.noctRise;
  const p = (irr / 1000) * PANEL.kWp * (1 - PANEL.tempCoef * Math.max(0, tcell - 25)) * PANEL.otras;
  return clamp(p, 0, PANEL.capKW);
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/* ---------- 1) Leer TMY real y agregar por mes ---------- */
function leerTMY() {
  const txt = readFileSync(join(ROOT, "data", "irradiancia-bogota-tmy.csv"), "utf8");
  const lineas = txt.split(/\r?\n/);
  const iHead = lineas.findIndex((l) => l.startsWith("time(UTC)"));
  if (iHead < 0) throw new Error("No se encontro la cabecera time(UTC) en el CSV");
  const ghiMes = Array(12).fill(0);   // kWh/m2 por mes (suma horaria de GHI/1000)
  const espMes = Array(12).fill(0);   // kWh FV esperados por mes
  const horasMes = Array(12).fill(0);
  for (let i = iHead + 1; i < lineas.length; i++) {
    const l = lineas[i];
    if (!/^\d{8}:\d{4},/.test(l)) continue; // corta en el footer
    const c = l.split(",");
    const mes = parseInt(c[0].slice(4, 6), 10) - 1;
    const tAire = parseFloat(c[1]);
    const ghi = parseFloat(c[3]);        // G(h) = GHI horizontal
    ghiMes[mes] += ghi / 1000;           // W/m2 * 1h -> kWh/m2
    espMes[mes] += fvKW(ghi, tAire);     // kW * 1h -> kWh
    horasMes[mes] += 1;
  }
  return { ghiMes, espMes, horasMes };
}

/* ---------- 2) Correr el simulador actual y medir su generacion diaria ----------
   El paso del sim avanza la hora en dt/6 (dt=0.5 -> 5 min por llamada, 288/dia).
   fv es potencia instantanea [kW]; energia = fv * (dt/6) [kWh]. */
function generacionModelada({ dias = 60, seed = 1 } = {}) {
  const dt = 0.5;
  const hPaso = dt / 6;                 // horas por paso
  const pasos = Math.round((dias * 24) / hPaso);
  const rt = { data: {}, queue: [], cmds: {}, rng: mulberry32(seed) };
  let s = initSolarEd();
  let energia = 0;
  const kwhPorDia = [];
  let accDia = 0, hAcc = 0;
  for (let i = 0; i < pasos; i++) {
    s = simSolarEd(s, dt, rt);
    const e = s.fv * hPaso;
    energia += e;
    accDia += e;
    hAcc += hPaso;
    if (hAcc >= 24 - 1e-9) { kwhPorDia.push(accDia); accDia = 0; hAcc = 0; }
  }
  const media = energia / dias;
  const varianza = kwhPorDia.reduce((a, d) => a + (d - media) ** 2, 0) / kwhPorDia.length;
  const cv = Math.sqrt(varianza) / media; // coef. de variacion dia a dia
  return { kwhDiaMedio: media, cvDiario: cv, nDias: kwhPorDia.length };
}

/* ---------- 3) Comparar ---------- */
const { ghiMes, espMes } = leerTMY();
const mod = generacionModelada({ dias: 60, seed: 1 });

// El sim no tiene fecha: su generacion mensual es el diario medio x dias del mes.
const modMes = DIAS_MES.map((d) => mod.kwhDiaMedio * d);

const filas = MESES.map((m, i) => {
  const esp = espMes[i];
  const modeladaM = modMes[i];
  const errAbs = modeladaM - esp;
  const errRel = (errAbs / esp) * 100;
  return { mes: m, ghi: ghiMes[i], esperada: esp, modelada: modeladaM, errAbs, errRel };
});

const espAnual = espMes.reduce((a, b) => a + b, 0);
const modAnual = modMes.reduce((a, b) => a + b, 0);
const errAnualRel = ((modAnual - espAnual) / espAnual) * 100;

// Indice de estacionalidad: mes max / mes min (que tanto varia el anio).
const estacReal = Math.max(...espMes) / Math.min(...espMes);
const estacMod = Math.max(...modMes) / Math.min(...modMes);
const iMinReal = espMes.indexOf(Math.min(...espMes));
const iMaxReal = espMes.indexOf(Math.max(...espMes));

/* ---------- 4) Reporte ---------- */
const pad = (s, n) => String(s).padStart(n);
console.log("\nVALIDACION 09 SOLAR-EDIFICIO  -  Bogota TMY (PVGIS v5.2)\n");
console.log("Mes  | GHI kWh/m2 | Esperada kWh | Modelada kWh | Err abs | Err rel");
console.log("-----|-----------|-------------|-------------|---------|--------");
for (const f of filas) {
  console.log(
    `${f.mes}  | ${pad(f.ghi.toFixed(1), 9)} | ${pad(f.esperada.toFixed(0), 11)} | ` +
    `${pad(f.modelada.toFixed(0), 11)} | ${pad(f.errAbs.toFixed(0), 7)} | ${pad(f.errRel.toFixed(1) + "%", 7)}`
  );
}
console.log("-----|-----------|-------------|-------------|---------|--------");
console.log(`Anual:  esperada ${espAnual.toFixed(0)} kWh | modelada ${modAnual.toFixed(0)} kWh | error ${errAnualRel.toFixed(1)}%`);
console.log(`\nGeneracion diaria del sim: ${mod.kwhDiaMedio.toFixed(1)} kWh/dia, CV dia a dia ${(mod.cvDiario * 100).toFixed(1)}% (ruido, no clima)`);
console.log(`Estacionalidad real (max/min): ${estacReal.toFixed(2)}x  (max ${MESES[iMaxReal]}, min ${MESES[iMinReal]})`);
console.log(`Estacionalidad del modelo:     ${estacMod.toFixed(2)}x  (solo por dias del mes)\n`);

/* ---------- 4b) Grafica SVG (barras agrupadas esperada vs modelada) ----------
   Theme-neutral: fondo transparente, tinta media (#898781) legible sobre claro
   y oscuro; azul = esperada (referencia real), naranja = modelada. Ambas series
   con etiqueta directa + leyenda. Paleta validada (dataviz validate_palette). */
function buildSVG() {
  const W = 760, H = 380, mL = 46, mR = 14, mT = 46, mB = 30;
  const pw = W - mL - mR, ph = H - mT - mB, base = mT + ph;
  const yMax = 2500, ticks = [0, 500, 1000, 1500, 2000, 2500];
  const INK = "#898781", GRID = "#c3c2b7", AZUL = "#2a78d6", NARANJA = "#eb6834";
  const gw = pw / 12, bw = 15, gap = 5;
  const yPix = (v) => base - (v / yMax) * ph;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui,-apple-system,'Segoe UI',sans-serif">`;
  s += `<text x="${mL}" y="22" fill="${INK}" font-size="14" font-weight="600">Generacion FV mensual: esperada (irradiancia real) vs modelada (sim actual) — kWh</text>`;
  // leyenda
  s += `<rect x="${W - mR - 210}" y="12" width="11" height="11" rx="2" fill="${AZUL}"/><text x="${W - mR - 195}" y="22" fill="${INK}" font-size="12">esperada</text>`;
  s += `<rect x="${W - mR - 120}" y="12" width="11" height="11" rx="2" fill="${NARANJA}"/><text x="${W - mR - 105}" y="22" fill="${INK}" font-size="12">modelada</text>`;
  // gridlines + eje y
  for (const t of ticks) {
    const y = yPix(t);
    s += `<line x1="${mL}" y1="${y}" x2="${mL + pw}" y2="${y}" stroke="${GRID}" stroke-width="1" opacity="0.5"/>`;
    s += `<text x="${mL - 6}" y="${y + 4}" fill="${INK}" font-size="11" text-anchor="end" font-variant-numeric="tabular-nums">${t}</text>`;
  }
  // barras
  filas.forEach((f, i) => {
    const gx = mL + i * gw;
    const x1 = gx + (gw - (2 * bw + gap)) / 2;
    const x2 = x1 + bw + gap;
    const hE = base - yPix(f.esperada), hM = base - yPix(f.modelada);
    s += `<rect x="${x1.toFixed(1)}" y="${yPix(f.esperada).toFixed(1)}" width="${bw}" height="${hE.toFixed(1)}" rx="3" fill="${AZUL}"/>`;
    s += `<rect x="${x2.toFixed(1)}" y="${yPix(f.modelada).toFixed(1)}" width="${bw}" height="${hM.toFixed(1)}" rx="3" fill="${NARANJA}"/>`;
    s += `<text x="${(gx + gw / 2).toFixed(1)}" y="${base + 16}" fill="${INK}" font-size="11" text-anchor="middle">${f.mes}</text>`;
  });
  s += `</svg>`;
  return s;
}
writeFileSync(join(ROOT, "docs", "09-validacion-grafica.svg"), buildSVG());

/* ---------- 5) Volcar datos para la doc ---------- */
const salida = {
  fuente: "PVGIS v5.2 TMY, Bogota (4.700 N, -74.150), elev 2547 m",
  generado: new Date().toISOString().slice(0, 10),
  panel: PANEL,
  meses: filas,
  anual: { esperada: espAnual, modelada: modAnual, errorRelPct: errAnualRel },
  modelo: { kwhDiaMedio: mod.kwhDiaMedio, cvDiarioPct: mod.cvDiario * 100 },
  estacionalidad: { realMaxMin: estacReal, modeloMaxMin: estacMod, mesMax: MESES[iMaxReal], mesMin: MESES[iMinReal] },
};
writeFileSync(join(ROOT, "docs", "09-validacion-datos.json"), JSON.stringify(salida, null, 2));
console.log("Datos escritos en docs/09-validacion-datos.json");
