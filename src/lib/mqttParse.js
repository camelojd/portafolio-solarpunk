/* ================================================================
   Parseo del payload del nodo de sensores. Puro y sin dependencias,
   para poder testearlo sin broker ni la libreria mqtt.
   ================================================================ */

/* Conversion aproximada lux -> W/m2 para luz diurna global.
   La eficacia luminosa de la luz de dia ronda 120 lux por W/m2; es una
   aproximacion (varia con el angulo solar y la nubosidad), suficiente para
   una lectura indicativa. El BH1750 entrega lux; el modelo usa W/m2. */
export const LUX_TO_WM2 = 1 / 120;

/* Convierte el payload MQTT (Uint8Array, Buffer o string JSON) en una lectura
   {temp, hum, irr} o null si es invalido. temp es el canal minimo: sin una
   temperatura numerica el mensaje se descarta. El sello de tiempo (recepcion en
   el navegador) lo pone el cliente, no este parseo ni el nodo. */
export function parseReading(payload) {
  let o;
  try {
    o = JSON.parse(typeof payload === "string" ? payload : payload.toString());
  } catch {
    return null;
  }
  if (!o || Array.isArray(o) || typeof o !== "object") return null;

  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const temp = num(o.temp);
  if (temp === undefined) return null;

  const hum = num(o.hum);
  // irr directo, o derivado de lux (BH1750) si el nodo no lo convierte.
  let irr = num(o.irr);
  if (irr === undefined) {
    const lux = num(o.lux);
    if (lux !== undefined) irr = lux * LUX_TO_WM2;
  }

  return { temp, hum, irr };
}
