/* ================================================================
   Utilidades numericas y de formato compartidas por los simuladores
   (src/sim) y por la UI (App.jsx).
   ================================================================ */

/* Acota v al rango [a, b] */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Formatea un numero con coma decimal (es-CO): 12.5 -> "12,5" */
export const fmt = (v, d = 1) => Number(v).toFixed(d).replace(".", ",");

/* Hora decimal (0..24) a "HH:MM" */
export const hhmm = (h) => {
  const H = Math.floor(h) % 24;
  const Mn = Math.floor((h % 1) * 60);
  return String(H).padStart(2, "0") + ":" + String(Mn).padStart(2, "0");
};

/* Segundos a "MM:SS" */
export const mmss = (t) => {
  const M = Math.floor(t / 60);
  const S = Math.floor(t % 60);
  return String(M).padStart(2, "0") + ":" + String(S).padStart(2, "0");
};
