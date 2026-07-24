import { clamp } from "../lib/util.js";

/* Propiedades del modelo termico por material del techo.
   Valores U reales de literatura (W/m2K), no factores inventados. Fuentes en docs/04-termico.md:
   - Guadua/bambu: ensamblaje multicapa U~0,67 W/m2K (3 capas); conductividad medida 0,12-0,17 W/mK.
     Se usa U=0,9 como valor representativo de un techo de guadua tipico.
     // TODO: fuente techo-especifica de guadua (las citas disponibles son de MUROS multicapa).
   - Acero (chapa de contenedor desnuda): la conduccion del acero es despreciable; el U lo domina
     la pelicula de aire. U~6 W/m2K (ISO 6946, resistencias superficiales Rsi 0,10 + Rse 0,04). */
/* Procedencia de cada valor: docs/supuestos/04-refugio-vivo.md */
export const UMBRALES = {
  uGuadua: 0.9, uAcero: 6.0,            // transmitancia termica del techo (W/m2K). Fuentes en el bloque de arriba.
  albedoGuadua: 0.5, albedoAcero: 0.35, // reflectancia solar del techo. Valores tipicos. // TODO: fuente
  costoAcero: 18.4, costoGuadua: 12.8,  // presupuesto (millones COP). Precio de mercado estimado. // TODO: fuente
  semanasAcero: 4, semanasGuadua: 5,    // cronograma de construccion. Estimacion propia. // TODO: fuente
  // Constantes fisicas del modelo estacionario:
  ho: 25,    // coef. de pelicula exterior (W/m2K); ISO 6946, Rse=0,04 -> ho=1/Rse
  ug: 2.5,   // acoplamiento interior-exterior por muros y ventilacion (W/m2K). Supuesto documentado.
  qint: 10,  // ganancias internas de los animales por m2 de techo (W/m2). Supuesto documentado.
  imax: 900, // irradiancia solar pico sobre el techo (W/m2)
};

export function simCobot(s, dt, rt) {
  // Nota: este sim es determinista por construccion, no usa RNG.
  const U = UMBRALES;
  const e = [];
  const t = s.t + dt;
  const hora = (s.hora + dt * 0.6) % 24;   // el dia avanza, un ciclo cada ~40 s
  let techo = s.techo;

  if (rt.cmds.maint) {
    rt.cmds.maint = false;
    techo = techo === "guadua" ? "contenedor" : "guadua";
    e.push(techo === "contenedor"
      ? "🏗️ Techo de contenedor de acero: barato en material, pero conduce el calor y el interior se dispara al mediodía"
      : "🌿 Techo de guadua: aísla mejor y estabiliza la temperatura interior del refugio");
  }

  const ext = 14 + 6 * Math.cos((2 * Math.PI * (hora - 14)) / 24);       // Bogota, ~14 C promedio
  const radNorm = hora >= 6 && hora <= 18 ? Math.sin((Math.PI * (hora - 6)) / 12) : 0;
  const uRoof = techo === "guadua" ? U.uGuadua : U.uAcero;              // transmitancia del techo (W/m2K)
  const alpha = 1 - (techo === "guadua" ? U.albedoGuadua : U.albedoAcero); // absortancia solar del techo
  const I = radNorm * U.imax;                                           // irradiancia sobre el techo (W/m2)
  // Temperatura sol-aire (ASHRAE): el techo asoleado se calienta por encima del aire exterior.
  const tSolAir = ext + (alpha * I) / U.ho;
  // Balance estacionario del interior: conduce por el techo (uRoof) hacia la sol-aire y por el resto
  // de la envolvente (ug) hacia el aire exterior, mas las ganancias de los animales (qint).
  // Un techo conductor (acero, U alto) arrastra el interior hacia la sol-aire caliente; uno aislante
  // (guadua, U bajo) lo mantiene cerca del aire exterior.
  const tinBase = (uRoof * tSolAir + U.ug * ext + U.qint) / (uRoof + U.ug);

  const refugios = s.refugios.map((r) => {
    const tint = Math.round(tinBase * 10) / 10;                          // modelo por m2: igual para los refugios del mismo material
    const dentro = tint >= r.tmin && tint <= r.tmax;
    return { ...r, tint, dentro };
  });

  const enRango = refugios.filter((r) => r.dentro).length;
  const confortT = (enRango / refugios.length) * 100;
  const confort = clamp(s.confort + (confortT - s.confort) * 0.25, 0, 100);
  const costo = techo === "contenedor" ? U.costoAcero : U.costoGuadua;   // millones COP
  const semanas = techo === "contenedor" ? U.semanasAcero : U.semanasGuadua;

  const hh = Math.floor(hora);
  const mm = Math.floor((hora - hh) * 60);
  const clock = (hh < 10 ? "0" + hh : "" + hh) + ":" + (mm < 10 ? "0" + mm : "" + mm);

  return { ...s, t, hora, techo, refugios, tint: refugios[0].tint, confort,
    area: s.area, costo, semanas, clock, _ev: e };
}

export function initRefugio() {
        return { t: 0, hora: 6, techo: "guadua", area: 78,
        refugios: [
          { especie: "gallinas", n: 20, largo: 6.0, ancho: 4.0, tmin: 18, tmax: 28, tint: 14, dentro: false, color: "#f1c40f" },
          { especie: "cerdos", n: 2, largo: 4.0, ancho: 3.0, tmin: 15, tmax: 25, tint: 14, dentro: false, color: "#e8a0a0" },
          { especie: "cabras", n: 4, largo: 5.0, ancho: 3.0, tmin: 10, tmax: 27, tint: 14, dentro: true, color: "#d9c7a3" },
        ],
        tint: 14, confort: 66, costo: 12.8, semanas: 5, clock: "06:00", _ev: [] };
}
