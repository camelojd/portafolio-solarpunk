/* ================================================================
   INDICE DE ESCENAS 3D LOW POLY SOLARPUNK
   Los 8 gemelos digitales activos, cada uno en su modulo, importando la
   paleta y el nucleo compartidos (palette.js + core.js).
   ================================================================ */
import { buildRefugio } from "./scenes/refugio.js";
import { buildFermenta } from "./scenes/fermenta.js";
import { buildSol } from "./scenes/sol.js";
import { buildCanal } from "./scenes/canal.js";
import { buildAbasto } from "./scenes/abasto.js";
import { buildSolarEd } from "./scenes/solaredificio.js";
import { buildObra } from "./scenes/obra.js";
import { buildAqua } from "./scenes/aqua.js";
import { buildHub } from "./scenes/hub.js";
import { buildRuta } from "./scenes/ruta.js";

// Archivados (fuera del deployment): scenes/fibra.js y scenes/ciclo.js
// siguen en disco pero ya no se registran aqui.

/* La clave es el project.id que ya usa App.jsx */
export const SCENE_BUILDERS = {
  hub: buildHub,               // pantalla de inicio (no es uno de los 8)
  ruta: buildRuta,             // ruta de 7 proyectos (no es uno de los 8)
  "sol-terraza": buildSol,
  "aqua-serve": buildAqua,
  cobot: buildRefugio,        // REFUGIO VIVO DT
  "linea-viva": buildFermenta, // FERMENTA VIVA DT
  "almacen-smart": buildAbasto, // ABASTO VIVO DT
  "obra-viva": buildObra,
  "solar-edificio": buildSolarEd,
  "canal-alerta": buildCanal,
};
