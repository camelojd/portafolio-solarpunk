/* ================================================================
   Genera src/sim/data/lluviaKennedy.js: serie horaria de precipitacion
   real, a partir del JSON agregado que se descargo de datos.gov.co.

   Fuente: IDEAM, estacion INEM Francisco de Paula Santander (Kennedy,
   Bogota), codigo 2120000122, dataset s54a-sgyg (API Socrata).
   Agregado horario (mm/h) via date_extract_* del servidor. Los huecos de
   la estacion (horas sin registro) se rellenan con 0 (sin lluvia).

   Reproducible:
     1) descargar el agregado horario a scripts/_ideam_kennedy_horario.json
        (ver docs/10-validacion.md para la URL exacta de la consulta)
     2) node scripts/gen-lluvia-embed.mjs
   ================================================================ */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const raw = JSON.parse(readFileSync(join(ROOT, "scripts", "_ideam_kennedy_horario.json"), "utf8"));
const map = new Map();
for (const r of raw) map.set(`${r.y}-${+r.m}-${+r.d}-${+r.h}`, +r.mm);

// Rango contiguo: 2024-10-01T00 a 2024-11-30T23 (hora local, tratada como naive).
const start = Date.UTC(2024, 9, 1, 0);
const end = Date.UTC(2024, 11, 1, 0); // 1 dic exclusivo
const mmh = [];
for (let t = start; t < end; t += 3600e3) {
  const d = new Date(t);
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${d.getUTCHours()}`;
  mmh.push(Math.round((map.get(key) || 0) * 10) / 10);
}

const acumulado = Math.round(mmh.reduce((a, b) => a + b, 0) * 10) / 10;
const maxHora = Math.max(...mmh);

const cuerpo = `/* ARCHIVO AUTO-GENERADO. No editar a mano.
   Generado por scripts/gen-lluvia-embed.mjs.
   Serie horaria de precipitacion REAL (mm/h).
   Fuente: IDEAM, estacion INEM Francisco de Paula Santander (Kennedy, Bogota),
   codigo 2120000122, via datos.gov.co (dataset s54a-sgyg, API Socrata).
   Periodo: 2024-10-01 a 2024-11-30 (hora local). Huecos de la estacion = 0.
   Regenerar: ver docs/10-validacion.md */
export const LLUVIA_KENNEDY = {
  meta: {
    estacion: "INEM Francisco de Paula Santander (Kennedy)",
    codigo: "2120000122",
    fuente: "IDEAM via datos.gov.co (s54a-sgyg)",
    periodo: "2024-10-01 a 2024-11-30",
    unidad: "mm/h",
    horas: ${mmh.length},
    acumuladoMm: ${acumulado},
    maxHoraMm: ${maxHora},
  },
  mmh: [${mmh.join(",")}],
};
`;

writeFileSync(join(ROOT, "src", "sim", "data", "lluviaKennedy.js"), cuerpo);
console.log(`Escrito src/sim/data/lluviaKennedy.js: ${mmh.length} horas, acumulado ${acumulado} mm, pico ${maxHora} mm/h`);
