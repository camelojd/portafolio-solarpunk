import * as THREE from "three";

/* ================================================================
   PALETA MAESTRA LOW POLY SOLARPUNK
   Los 10 gemelos comparten estos colores. Nada por fuera de aqui.
   ================================================================ */
export const PAL = {
  // naturales / solarpunk
  hoja: "#7CB342",
  musgo: "#558B2F",
  aguaVerde: "#26A69A",
  terracota: "#E2725B",
  arena: "#E8D5B7",
  maderaClara: "#C9A227",
  maderaOscura: "#8D6E63",
  // cielo y agua
  azulBogota: "#4F7CAC",
  cieloClaro: "#87CEEB",
  aguaProfunda: "#1E6091",
  atardecer: "#FF8C42",
  // industriales / neutros
  aceroClaro: "#B0BEC5",
  aceroOscuro: "#546E7A",
  cemento: "#9E9E9E",
  asfalto: "#37474F",
  // extras acotados
  panelSolar: "#1A237E",
  blanco: "#F5F1E8",
  guadua: "#A8B545",
};

/* Semaforo de estado, identico en los 10 proyectos */
export const SEM = {
  ok: "#22C55E",
  aviso: "#EAB308",
  alerta: "#F97316",
  critico: "#EF4444",
};

export const C_OK = new THREE.Color(SEM.ok);
export const C_AVISO = new THREE.Color(SEM.aviso);
export const C_ALERTA = new THREE.Color(SEM.alerta);
export const C_CRITICO = new THREE.Color(SEM.critico);

/* Color de semaforo continuo: k en [0,1] recorre verde -> amarillo -> naranja -> rojo */
export function semaforo(k, out) {
  const c = out || new THREE.Color();
  if (k < 1 / 3) c.copy(C_OK).lerp(C_AVISO, k * 3);
  else if (k < 2 / 3) c.copy(C_AVISO).lerp(C_ALERTA, (k - 1 / 3) * 3);
  else c.copy(C_ALERTA).lerp(C_CRITICO, Math.min((k - 2 / 3) * 3, 1));
  return c;
}

/* ================================================================
   MATERIALES COMPARTIDOS
   - MeshLambertMaterial con flatShading: el look low poly entero.
   - mat(): cacheado y compartido (menos draw state, mas FPS).
     NUNCA animar color/emissive de un material de mat().
   - umat(): material unico para objetos cuyo color SI se anima.
   ================================================================ */
let _cache = new Map();

export function mat(color, opts = {}) {
  const key = color + "|" + JSON.stringify(opts);
  let m = _cache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });
    _cache.set(key, m);
  }
  return m;
}

/* El host de la app hace dispose() de todo el root al cambiar de escena,
   asi que el cache compartido debe vaciarse al construir cada escena para
   no reutilizar materiales ya destruidos (pantalla negra). */
export function clearMatCache() { _cache = new Map(); }

export function umat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });
}

/* Material con vertex colors (terrenos, arboles fusionados) */
export function vmat(opts = {}) {
  return new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, ...opts });
}
