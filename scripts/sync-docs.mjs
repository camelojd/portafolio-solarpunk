/* ================================================================
   Copia docs/ -> public/docs/ para que los enlaces "ver supuestos"
   se sirvan desde el sitio. Se ejecuta en el hook prebuild (npm),
   asi corre tanto en local como en el build de Vercel, y nunca se
   desincroniza. Regenera desde cero para no dejar archivos huerfanos.
   ================================================================ */
import { rmSync, cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(ROOT, "docs");
const dest = join(ROOT, "public", "docs");

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("docs -> public/docs sincronizado");
