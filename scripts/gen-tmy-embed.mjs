/* ================================================================
   Genera src/sim/data/tmyBogota.js: perfil horario medio por mes,
   derivado de data/irradiancia-bogota-tmy.csv (PVGIS v5.2 TMY).

   - Mes por fecha UTC (los totales mensuales son invariantes a zona).
   - Hora del dia en LOCAL (UTC-5) para que la curva diurna tenga su
     pico al mediodia solar de Bogota.
   - Salida: GHI [W/m2] y temp aire [C], 12 meses x 24 horas.

   Reproducible: node scripts/gen-tmy-embed.mjs
   ================================================================ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TZ = 5; // Bogota = UTC-5, sin horario de verano

const txt = readFileSync(join(ROOT, "data", "irradiancia-bogota-tmy.csv"), "utf8");
const lineas = txt.split(/\r?\n/);
const iHead = lineas.findIndex((l) => l.startsWith("time(UTC)"));
if (iHead < 0) throw new Error("No se encontro la cabecera time(UTC)");

const sumG = Array.from({ length: 12 }, () => Array(24).fill(0));
const sumT = Array.from({ length: 12 }, () => Array(24).fill(0));
const cnt = Array.from({ length: 12 }, () => Array(24).fill(0));

for (let i = iHead + 1; i < lineas.length; i++) {
  const l = lineas[i];
  if (!/^\d{8}:\d{4},/.test(l)) continue;
  const c = l.split(",");
  const mes = parseInt(c[0].slice(4, 6), 10) - 1;
  const hUTC = parseInt(c[0].slice(9, 11), 10);
  const hLoc = ((hUTC - TZ) % 24 + 24) % 24;
  const tAire = parseFloat(c[1]);
  const ghi = parseFloat(c[3]);
  sumG[mes][hLoc] += ghi;
  sumT[mes][hLoc] += tAire;
  cnt[mes][hLoc] += 1;
}

const ghi = sumG.map((row, m) => row.map((s, h) => +(s / cnt[m][h]).toFixed(1)));
const temp = sumT.map((row, m) => row.map((s, h) => +(s / cnt[m][h]).toFixed(2)));

const cuerpo = `/* ARCHIVO AUTO-GENERADO. No editar a mano.
   Generado por scripts/gen-tmy-embed.mjs desde data/irradiancia-bogota-tmy.csv
   Fuente: PVGIS v5.2 TMY, Bogota (4.700 N, -74.150), elev 2547 m.
   Perfil horario medio por mes. Indices: [mes 0..11][hora local 0..23], UTC-5.
   ghi en W/m2, temp aire en C. Regenerar: node scripts/gen-tmy-embed.mjs */
export const TMY_BOGOTA = {
  meta: { fuente: "PVGIS v5.2 TMY", lugar: "Bogota (El Dorado)", tz: "UTC-5", generado: "${new Date().toISOString().slice(0, 10)}" },
  ghi: ${JSON.stringify(ghi)},
  temp: ${JSON.stringify(temp)},
};
`;

mkdirSync(join(ROOT, "src", "sim", "data"), { recursive: true });
writeFileSync(join(ROOT, "src", "sim", "data", "tmyBogota.js"), cuerpo);
console.log("Escrito src/sim/data/tmyBogota.js");
// verificacion rapida: GHI diario medio por mes (kWh/m2)
ghi.forEach((row, m) => {
  const kwh = row.reduce((a, b) => a + b, 0) / 1000;
  console.log(`Mes ${m + 1}: ${kwh.toFixed(2)} kWh/m2/dia`);
});
