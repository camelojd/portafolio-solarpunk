import * as THREE from "three";
import { PAL, mat, umat, C_OK, C_AVISO, C_CRITICO } from "../palette.js";
import { makeWorld, makePiso, makeCerros, plantTrees, makeHumano, enableShadows, P, B, Cyl, ChB, clamp01, rnd } from "../core.js";

/* ================================================================
   OBRA-VIVA DT: vigilancia SST y ambiental de obra.
   El chaleco de cada trabajador es el semaforo. Polvo PM10, grua.
   ================================================================ */
export function buildObra(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 18, sunR: 30 });
  makeCerros(root, { z: -46, s: 1 });
  makePiso(root, 30, 26, PAL.maderaOscura);
  plantTrees(root, Array.from({ length: 6 }, () => ({ x: rnd(-13, 13), y: 0.05, z: (Math.random() < 0.5 ? 1 : -1) * rnd(9, 12), s: rnd(1.6, 2.4), ry: rnd(0, 6) })));

  // vecindario al fondo: casas con techo a dos aguas, instanciadas
  const casaParts = new THREE.Group();
  const casaColors = [PAL.terracota, PAL.arena, PAL.maderaClara];
  [[-11, 8], [11, 7], [-11, -8], [11, -8.5], [-13, 0], [13, 1]].forEach(([x, z], i) => {
    const g = new THREE.Group();
    P(g, ChB(2.6, 2.2, 2.6, mat(casaColors[i % 3]), 0.1), 0, 1.1, 0);
    const techo = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.1, 4), mat(PAL.terracota));
    techo.rotation.y = Math.PI / 4;
    P(g, techo, 0, 2.75, 0);
    g.position.set(x, 0, z);
    casaParts.add(g);
  });
  root.add(casaParts);

  // edificio en obra: pisos apilados (planos), columnas
  const cols = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const c = B(0.34, 3.4, 0.34, mat(PAL.aceroClaro));
    P(root, c, 2.2 + i * 1.9, 2, -2.4 + j * 2);
    cols.push(c);
  }
  [1.4, 3.1].forEach((y) => P(root, B(5.4, 0.16, 5.4, mat(PAL.cemento)), 4.1, y, -0.4));

  // andamios: cilindros delgados de 5 lados
  [[-7.4, 6.4], [7.4, 6.4], [-7.4, -6.4], [7.4, -6.4]].forEach(([x, z]) => P(root, Cyl(0.06, 0.07, 3, mat(PAL.maderaClara), 5), x, 1.5, z));

  // grua: torre + brazo + cable con rotacion lenta
  P(root, ChB(1, 0.3, 1, mat(PAL.atardecer), 0.05), -6, 0.45, -4);
  P(root, Cyl(0.14, 0.16, 8, mat(PAL.atardecer), 6), -6, 4.3, -4);
  const jib = new THREE.Group();
  jib.position.set(-6, 8.2, -4);
  root.add(jib);
  P(jib, B(9, 0.14, 0.2, mat(PAL.maderaClara)), 2.4, 0, 0);
  P(jib, B(2.4, 0.14, 0.2, mat(PAL.maderaClara)), -1.9, 0, 0);
  P(jib, ChB(0.5, 0.4, 0.4, mat(PAL.aceroOscuro), 0.05), -2.6, 0, 0);
  const hook = B(0.4, 0.4, 0.4, mat(PAL.maderaClara));
  hook.userData.noShadow = true;
  P(jib, hook, 4.6, -3.1, 0);

  // postes de sensores perimetrales (semaforo de riesgo)
  const poles = [];
  [[-7.4, 6.4], [0, 6.9], [7.4, 6.4], [7.9, 0], [7.4, -6.4], [0, -6.9], [-7.4, -6.4], [-7.9, 0]].forEach(([x, z]) => {
    P(root, Cyl(0.05, 0.06, 2.4, mat(PAL.aceroOscuro), 6), x, 1.2, z);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), umat(C_OK.getStyle(), { emissive: C_OK.getStyle(), emissiveIntensity: 1.1 }));
    head.userData.noShadow = true;
    P(root, head, x, 2.5, z);
    poles.push(head);
  });

  // cuadrilla: el chaleco es el semaforo (dato principal, se lee de lejos)
  const workers = [];
  for (let i = 0; i < 5; i++) {
    const chaleco = umat(PAL.atardecer, { emissive: PAL.atardecer, emissiveIntensity: 0.5 });
    const h = makeHumano(chaleco);
    h.position.set(rnd(0, 7), 0, rnd(-3, 3));
    root.add(h);
    workers.push({ g: h, chaleco, ph: rnd(0, 6) });
  }

  // polvo PM10: puntos beige flotando
  const nD = 380;
  const dPos = new Float32Array(nD * 3);
  for (let i = 0; i < nD; i++) { dPos[i * 3] = rnd(-7, 7); dPos[i * 3 + 1] = rnd(0.3, 5); dPos[i * 3 + 2] = rnd(-6, 6); }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({ color: "#D9C9A8", size: 0.09, transparent: true, opacity: 0, depthWrite: false });
  const dust = new THREE.Points(dGeo, dMat);
  dust.userData.noShadow = true;
  root.add(dust);

  jib.userData.tip = "Grua torre. Gira en horario laboral";
  workers.forEach((w, i) => { w.g.userData.tip = "Trabajador " + (i + 1) + ": el chaleco es el semaforo de calor (WBGT)"; });
  poles.forEach((p) => { p.userData.tip = "Sensor perimetral: semaforo de riesgo (vibracion, ruido, PM10)"; });

  enableShadows(root);

  const _tmp = new THREE.Color();
  return {
    cam: { radius: 19, phi: 1.02, theta: 0.75, target: [0, 2.4, 0], auto: 0.05, minR: 8, maxR: 40 },
    update(dt, t) {
      const d = rt.data || {};
      const hour = d.hour !== undefined ? d.hour : 12;
      world.setHour(hour, 0);
      if (d.laboral) jib.rotation.y += dt * 0.12;
      hook.position.y = -3.1 + Math.sin(t * 0.5) * 0.7;

      // vibracion: las columnas tiemblan
      const ppvK = clamp01((d.ppv || 0) / 34);
      cols.forEach((c, i) => { c.position.x += Math.sin(t * 26 + i) * ppvK * 0.006; });

      // semaforo de riesgo en los postes
      const riesgo = d.riesgo !== undefined ? d.riesgo : clamp01((d.pm10 || 60) / 220);
      const tgt = riesgo > 0.62 ? C_CRITICO : riesgo > 0.34 ? C_AVISO : C_OK;
      poles.forEach((p, i) => {
        p.material.color.lerp(tgt, 0.06);
        p.material.emissive.copy(p.material.color);
        p.material.emissiveIntensity = riesgo > 0.62 ? 0.8 + Math.abs(Math.sin(t * 6 + i)) * 1.1 : 1.1;
      });

      // el chaleco de la cuadrilla: naranja normal -> amarillo (calor) -> rojo (evacuar)
      const wbgt = d.wbgt !== undefined ? d.wbgt : 26;
      const chalTgt = wbgt > 32 ? C_CRITICO : wbgt > 30 ? C_AVISO : new THREE.Color(PAL.atardecer);
      workers.forEach((w) => {
        w.chaleco.color.lerp(chalTgt, 0.06);
        w.chaleco.emissive.copy(w.chaleco.color).multiplyScalar(0.4);
        w.g.position.y = Math.abs(Math.sin(t * 3 + w.ph)) * 0.04;  // bob
      });

      // polvo PM10 proporcional al valor
      const pm = clamp01(((d.pm10 || 0) - 30) / 190);
      dMat.opacity += (pm * 0.9 - dMat.opacity) * 0.05;
      dust.visible = dMat.opacity > 0.02;
      if (dust.visible) {
        const a = dGeo.attributes.position.array;
        for (let i = 0; i < nD; i++) {
          a[i * 3] += dt * 0.28; a[i * 3 + 1] += dt * 0.16;
          if (a[i * 3] > 7) a[i * 3] = -7;
          if (a[i * 3 + 1] > 5) a[i * 3 + 1] = 0.3;
        }
        dGeo.attributes.position.needsUpdate = true;
      }
    },
  };
}
