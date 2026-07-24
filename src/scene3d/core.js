import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PAL, mat, umat, vmat, clearMatCache } from "./palette.js";

/* ================================================================
   NUCLEO 3D COMPARTIDO (low poly solarpunk)
   - Setup de 3 luces identico en las 10 escenas, con hora simulada
     a latitud Bogota.
   - Cielo de gradiente (shader de dos colores, nunca skybox).
   - Terreno facetado con vertex colors.
   - Geometria instanciada para todo lo repetido.
   ================================================================ */

export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/* -------- primitivas de bajo conteo -------- */
export function P(parent, mesh, x = 0, y = 0, z = 0) {
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
export function B(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
export function Cyl(rt, rb, h, m, seg = 8) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); }
export function Cono(r, h, m, seg = 8) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m); }
export function Ico(r, m, det = 0) { return new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), m); }

/* Caja con esquinas achaflanadas (formas redondeadas, nada de cubos crudos) */
export function chGeo(w, h, d, c = 0.07) {
  const cc = Math.min(c, w / 3, d / 3, h / 3);
  const hw = w / 2, hd = d / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw + cc, -hd);
  s.lineTo(hw - cc, -hd); s.lineTo(hw, -hd + cc);
  s.lineTo(hw, hd - cc); s.lineTo(hw - cc, hd);
  s.lineTo(-hw + cc, hd); s.lineTo(-hw, hd - cc);
  s.lineTo(-hw, -hd + cc); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(h - 2 * cc, 0.01), bevelEnabled: true, bevelThickness: cc, bevelSize: cc * 0.9, bevelSegments: 1, steps: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, cc + Math.max(h - 2 * cc, 0.01) / 2 - h / 2 + cc / 2, 0);
  g.computeVertexNormals();
  return g;
}
export function ChB(w, h, d, m, c = 0.07) { return new THREE.Mesh(chGeo(w, h, d, c), m); }

/* Pinta un color plano en el atributo color de una geometria */
export function paintGeo(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

/* Fusiona geometrias ya pintadas y transformadas: un solo draw call.
   Normaliza a no-indexada y deja solo position+normal+color para que
   mezclas de icosaedros (no indexados) y cajas/conos (indexados) fusionen. */
export function mergePainted(parts) {
  const geos = parts.map(({ geo, hex, x = 0, y = 0, z = 0, s = 1, rx = 0, ry = 0, rz = 0 }) => {
    let g = geo.clone();
    if (rx) g.rotateX(rx);
    if (ry) g.rotateY(ry);
    if (rz) g.rotateZ(rz);
    if (s !== 1) g.scale(s, s, s);
    g.translate(x, y, z);
    if (g.index) g = g.toNonIndexed();
    // deja solo los atributos comunes para que la fusion sea homogenea
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    return paintGeo(g, hex);
  });
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return merged;
}

/* InstancedMesh a partir de una lista de {x,y,z,s,ry} */
export function scatter(root, geo, material, items, castShadow = false) {
  const im = new THREE.InstancedMesh(geo, material, items.length);
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3();
  items.forEach((it, i) => {
    q.setFromAxisAngle(up, it.ry || 0);
    const s = it.s || 1;
    M4.compose(v.set(it.x, it.y || 0, it.z), q, new THREE.Vector3(s, s, s));
    im.setMatrixAt(i, M4);
  });
  im.castShadow = castShadow;
  im.receiveShadow = true;
  if (!castShadow) im.userData.noShadow = true;
  root.add(im);
  return im;
}

/* ================================================================
   MUNDO: cielo + fog + 3 luces con hora del dia (lat ~5 N)
   ================================================================ */
const SKY_DAY_TOP = new THREE.Color(PAL.cieloClaro);
const SKY_DAY_BOT = new THREE.Color("#DDEBD2");
const SKY_DAWN_TOP = new THREE.Color("#7FA8C9");
const SKY_DAWN_BOT = new THREE.Color(PAL.atardecer);
const SKY_NIGHT_TOP = new THREE.Color("#16223F");
const SKY_NIGHT_BOT = new THREE.Color("#33406B");
const SUN_DAWN = new THREE.Color(PAL.atardecer);
const SUN_NOON = new THREE.Color("#FFF8E1");
const SUN_DUSK = new THREE.Color("#FF7043");
const SUN_NIGHT = new THREE.Color("#3949AB");

export function makeWorld(scene, root, opts = {}) {
  // El host destruye todos los recursos del root al cambiar de escena.
  // Vaciamos los caches compartidos para que esta escena cree los suyos
  // frescos y no reutilice materiales/geometrias ya destruidos.
  clearMatCache();
  _treeGeo = null;

  // cielo: domo invertido con gradiente vertical de dos colores
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_DAY_TOP.clone() }, bot: { value: SKY_DAY_BOT.clone() } },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec3 vP; uniform vec3 top; uniform vec3 bot; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(bot, top, pow(h, 0.9)), 1.0); }",
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(170, 16, 10), skyMat);
  dome.userData.noShadow = true;
  root.add(dome);

  scene.fog = new THREE.Fog("#DDEBD2", opts.fogNear || 34, opts.fogFar || 150);

  // 1. HemisphereLight: el look solarpunk de un golpe
  const hemi = new THREE.HemisphereLight(PAL.cieloClaro, PAL.hoja, 0.6);
  root.add(hemi);
  // 2. Sol direccional con sombras (mapa 1024)
  const sun = new THREE.DirectionalLight(SUN_NOON, 0.8);
  sun.castShadow = !opts.noShadows;
  sun.shadow.mapSize.set(1024, 1024);
  const d = opts.shadowArea || 16;
  sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
  sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 90;
  sun.shadow.bias = -0.0004;
  sun.position.set(14, 24, 10);
  root.add(sun);
  // 3. AmbientLight segun clima
  const amb = new THREE.AmbientLight("#FFFFFF", 0.3);
  root.add(amb);

  // sol visible: esfera facetada emissive
  const sunBall = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), umat("#FFE082", { emissive: "#FFD54F", emissiveIntensity: 1.2 }));
  sunBall.userData.noShadow = true;
  sunBall.visible = !opts.noSunBall;
  root.add(sunBall);

  const _top = new THREE.Color(), _bot = new THREE.Color(), _sc = new THREE.Color();

  /* hora en [0,24]; clima: 0 despejado -> 1 nublado/tormenta */
  function setHour(hour = 12, clima = 0) {
    const tDay = (hour - 6) / 12;                       // 0 amanecer, 1 atardecer
    const dayK = clamp01(Math.sin(Math.PI * clamp01(tDay)));
    const isDay = hour >= 5.5 && hour <= 18.5;
    // posicion del sol: arco este-oeste
    const ang = Math.PI * clamp01(tDay);
    const R = opts.sunR || 30;
    const sx = Math.cos(ang) * R, sy = Math.max(isDay ? 2 : -6, Math.sin(ang) * R * 0.75), sz = -(opts.sunZ !== undefined ? opts.sunZ : 18);
    sun.position.set(sx, sy, sz);
    sunBall.position.set(sx, Math.max(sy, 1.2), sz * 1.4);
    sunBall.visible = !opts.noSunBall && isDay;
    // color del sol: amanecer -> mediodia -> atardecer -> noche
    if (!isDay) _sc.copy(SUN_NIGHT);
    else if (tDay < 0.5) _sc.copy(SUN_DAWN).lerp(SUN_NOON, clamp01(tDay * 2));
    else _sc.copy(SUN_NOON).lerp(SUN_DUSK, clamp01((tDay - 0.5) * 2));
    sun.color.copy(_sc);
    sun.intensity = isDay ? 0.25 + dayK * 0.65 : 0.15;
    hemi.intensity = 0.25 + dayK * 0.4;
    amb.intensity = 0.3 - clima * 0.08;
    amb.color.set(clima > 0.5 ? "#B0C4DE" : "#FFFFFF");
    // cielo y fog
    const edgeK = clamp01(1 - Math.abs(tDay - 0.5) * 2);  // 1 mediodia, 0 bordes
    if (!isDay) { _top.copy(SKY_NIGHT_TOP); _bot.copy(SKY_NIGHT_BOT); }
    else {
      _top.copy(SKY_DAWN_TOP).lerp(SKY_DAY_TOP, edgeK);
      _bot.copy(SKY_DAWN_BOT).lerp(SKY_DAY_BOT, edgeK);
    }
    // clima nublado apaga el cielo
    _top.lerp(new THREE.Color("#8FA3AD"), clima * 0.75);
    _bot.lerp(new THREE.Color("#B8C4C9"), clima * 0.7);
    skyMat.uniforms.top.value.lerp(_top, 0.08);
    skyMat.uniforms.bot.value.lerp(_bot, 0.08);
    scene.fog.color.copy(skyMat.uniforms.bot.value);
    return dayK;
  }
  setHour(10);
  return { skyMat, hemi, sun, amb, sunBall, setHour };
}

/* ================================================================
   TERRENO: plano subdividido con pendiente suave y vertex colors
   ================================================================ */
export function makeTerrain(root, opts = {}) {
  const size = opts.size || 46, seg = opts.seg || 20, amp = opts.amp !== undefined ? opts.amp : 0.55;
  const flatR = opts.flatR !== undefined ? opts.flatR : 8;   // radio central plano
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cHoja = new THREE.Color(opts.cBase || PAL.hoja);
  const cMusgo = new THREE.Color(opts.cPendiente || PAL.musgo);
  const cArena = new THREE.Color(opts.cCamino || PAL.arena);
  const colors = new Float32Array(pos.count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const k = clamp01((r - flatR) / (size * 0.5 - flatR));
    const y = amp * k * (Math.sin(x * 0.35 + 1.3) * 0.5 + Math.sin(z * 0.42 + 4.1) * 0.5 + Math.sin((x + z) * 0.21) * 0.6 + 0.9);
    pos.setY(i, y);
    tmp.copy(cHoja).lerp(cMusgo, clamp01(y / (amp * 1.6)));
    if (opts.camino && opts.camino(x, z)) tmp.copy(cArena);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, vmat());
  m.receiveShadow = true;
  m.userData.noShadow = true;
  root.add(m);
  return m;
}

/* Piso duro simple (cemento / asfalto) */
export function makePiso(root, w, d, hex, y = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), mat(hex));
  m.position.y = y + 0.07;
  m.receiveShadow = true;
  m.userData.noShadow = true;
  root.add(m);
  return m;
}

/* ================================================================
   ARBOL LOW POLY (~60 tris): copa icosaedro + tronco de 5 lados.
   Devuelve geometria fusionada con vertex colors para instanciar.
   ================================================================ */
let _treeGeo = null;
export function treeGeo() {
  if (_treeGeo) return _treeGeo;
  _treeGeo = mergePainted([
    { geo: new THREE.CylinderGeometry(0.05, 0.09, 0.55, 5), hex: PAL.maderaOscura, y: 0.27 },
    { geo: new THREE.IcosahedronGeometry(0.36, 0), hex: PAL.musgo, y: 0.75, s: 1 },
    { geo: new THREE.IcosahedronGeometry(0.22, 0), hex: PAL.hoja, x: 0.16, y: 0.95, z: 0.1 },
  ]);
  return _treeGeo;
}
export function plantTrees(root, items, castShadow = false) {
  return scatter(root, treeGeo(), vmat(), items, castShadow);
}

/* ================================================================
   CERROS DE BOGOTA: silueta facetada al fondo (firma visual)
   ================================================================ */
export function makeCerros(root, opts = {}) {
  const z = opts.z !== undefined ? opts.z : -38;
  const s = opts.s || 1;
  const parts = [];
  const hills = [
    [-26, 9, 14], [-12, 12, 16], [0, 10, 15], [7, 14, 17], [18, 11, 15], [30, 8, 13],
  ];
  hills.forEach(([x, h, r], i) => {
    parts.push({ geo: new THREE.ConeGeometry(r * s, h * s, 6), hex: i % 2 ? "#3E6B27" : PAL.musgo, x: x * s, y: h * s * 0.5 - 1, z: z + (i % 3) * 4 * s });
  });
  const geo = mergePainted(parts);
  const m = new THREE.Mesh(geo, vmat());
  m.userData.noShadow = true;
  root.add(m);
  return m;
}

/* ================================================================
   LLUVIA: lineas verticales cortas (LineSegments), muy barato
   ================================================================ */
export function makeRain(root, opts = {}) {
  const n = opts.n || 300, area = opts.area || 14, yTop = opts.yTop || 12;
  const pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const x = rnd(-area, area), y = rnd(0.5, yTop), z = rnd(-area, area);
    pos.set([x, y, z, x, y - 0.45, z], i * 6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const material = new THREE.LineBasicMaterial({ color: "#9FC4DD", transparent: true, opacity: 0 });
  const lines = new THREE.LineSegments(geo, material);
  lines.userData.noShadow = true;
  root.add(lines);
  return {
    obj: lines,
    step(dt, k) {
      material.opacity += (clamp01(k) * 0.75 - material.opacity) * 0.06;
      lines.visible = material.opacity > 0.02;
      if (!lines.visible) return;
      const a = geo.attributes.position.array;
      const v = (9 + k * 8) * dt;
      for (let i = 0; i < n; i++) {
        a[i * 6 + 1] -= v; a[i * 6 + 4] -= v;
        if (a[i * 6 + 1] < 0.2) {
          const x = rnd(-area, area), z = rnd(-area, area);
          a.set([x, yTop, z, x, yTop - 0.45, z], i * 6);
        }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/* ================================================================
   AUTO LOW POLY (~250 tris): cuerpo achaflanado + cabina + 4 ruedas
   ================================================================ */
export function makeAuto(hex, largo = 1.15) {
  const g = new THREE.Group();
  P(g, ChB(largo, 0.3, 0.52, mat(hex), 0.06), 0, 0.32, 0);
  P(g, ChB(largo * 0.5, 0.24, 0.46, mat(PAL.aceroClaro), 0.05), -largo * 0.06, 0.58, 0);
  const wg = new THREE.CylinderGeometry(0.13, 0.13, 0.09, 8);
  wg.rotateX(Math.PI / 2);
  const wm = mat(PAL.asfalto);
  [[-largo * 0.32, 0.29], [largo * 0.32, 0.29], [-largo * 0.32, -0.29], [largo * 0.32, -0.29]].forEach(([x, z]) => {
    P(g, new THREE.Mesh(wg, wm), x, 0.14, z);
  });
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ================================================================
   TRABAJADOR ESTILIZADO (~120 tris): cuerpo + cabeza + casco.
   El chaleco (cuerpo) es el semaforo: pasa umat propio.
   ================================================================ */
export function makeHumano(chalecoMat) {
  const g = new THREE.Group();
  const cuerpo = P(g, Cyl(0.09, 0.12, 0.3, chalecoMat, 6), 0, 0.32, 0);
  P(g, Cyl(0.035, 0.045, 0.18, mat(PAL.aceroOscuro), 5), -0.05, 0.09, 0);
  P(g, Cyl(0.035, 0.045, 0.18, mat(PAL.aceroOscuro), 5), 0.05, 0.09, 0);
  P(g, Ico(0.075, mat("#C99A6B")), 0, 0.55, 0);
  P(g, Cono(0.085, 0.09, mat(PAL.maderaClara), 7), 0, 0.63, 0);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.userData.noShadow = true; } });
  cuerpo.castShadow = true;
  return g;
}

/* ================================================================
   SOMBRAS: solo objetos principales; lo marcado noShadow no proyecta
   ================================================================ */
export function enableShadows(root) {
  root.traverse((o) => {
    if (o.isMesh || o.isInstancedMesh) {
      o.receiveShadow = true;
      if (o.userData.noShadow || (o.material && o.material.transparent)) o.castShadow = false;
      else o.castShadow = true;
    }
  });
}

/* Flecha plana (viento / evacuacion): cono achatado */
export function makeFlecha(hex) {
  const g = new THREE.Group();
  const m = umat(hex, { emissive: hex, emissiveIntensity: 0.4 });
  const c = Cono(0.16, 0.4, m, 4);
  c.rotation.z = -Math.PI / 2;
  c.scale.z = 0.35;
  g.add(c);
  const tail = B(0.3, 0.02, 0.08, m);
  tail.position.x = -0.3;
  g.add(tail);
  g.userData.mat = m;
  g.traverse((o) => { o.userData.noShadow = true; });
  return g;
}

/* ================================================================
   Limpieza: destruye geometrias y materiales del root al cambiar
   de escena. La usa el componente Scene. (Ver clearMatCache/treeGeo
   en makeWorld: los caches compartidos se vacian al reconstruir.)
   ================================================================ */
export function disposeGroup(root) {
  const kill = [];
  root.traverse((o) => { if (o !== root) kill.push(o); });
  kill.forEach((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
  while (root.children.length) root.remove(root.children[0]);
}
