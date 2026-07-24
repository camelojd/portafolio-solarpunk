/* ================================================================
   Simuladores de los 8 gemelos digitales activos.
   Cada modulo exporta su funcion sim*, su init*() (estado inicial)
   y sus UMBRALES. Aqui se arman los mapas que consume App.jsx.

   Determinismo: cada sim usa rt.rng si se le inyecta (ver ../lib/rng.js);
   si no, cae en Math.random y el comportamiento en produccion es identico.
   ================================================================ */
import { simSol, initSol } from "./sol.js";
import { simAqua, initAqua } from "./aqua.js";
import { simCobot, initRefugio } from "./refugio.js";
import { simLinea, initFermenta } from "./fermenta.js";
import { simAlmacen, initAbasto } from "./abasto.js";
import { simObra, initObra } from "./obra.js";
import { simSolarEd, initSolarEd } from "./solarEd.js";
import { simCanal, initCanal } from "./canal.js";

// Archivados (fuera del deployment): sim/fibra.js y sim/ciclo.js siguen en
// disco con sus tests, pero ya no se registran ni se importan aqui.

/* id de proyecto (el mismo que usan las escenas 3D) -> simulador */
export const SIMS = {
  "sol-terraza": simSol,
  "aqua-serve": simAqua,
  cobot: simCobot,
  "linea-viva": simLinea,
  "almacen-smart": simAlmacen,
  "canal-alerta": simCanal,
  "obra-viva": simObra,
  "solar-edificio": simSolarEd,
};

const INITS = {
  "sol-terraza": initSol,
  "aqua-serve": initAqua,
  cobot: initRefugio,
  "linea-viva": initFermenta,
  "almacen-smart": initAbasto,
  "canal-alerta": initCanal,
  "obra-viva": initObra,
  "solar-edificio": initSolarEd,
};

/* Estado inicial por id (equivale al initSim que vivia en App.jsx) */
export function initSim(id) {
  const f = INITS[id];
  return f ? f() : null;
}
