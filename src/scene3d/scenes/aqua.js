import * as THREE from "three";
import { PAL, mat, umat } from "../palette.js";
import { makeWorld, makePiso, makeRain, enableShadows, P, B, Cyl, ChB, clamp01 } from "../core.js";

/* ================================================================
   AQUA SERVE DT: captacion pluvial + enfriamiento de servidores.
   Microturbinas que giran con el flujo; rack con color por temp.
   ================================================================ */
export function buildAqua(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 16, sunR: 26, noSunBall: true });
  world.setHour(12, 0.3);
  makePiso(root, 26, 22, PAL.cemento);

  // edificio de servidores (torre de pisos)
  const floors = 6;
  for (let i = 0; i < floors; i++) {
    P(root, ChB(4, 0.92, 4, mat(i % 2 ? PAL.aceroOscuro : PAL.aceroClaro), 0.08), 0, 0.5 + i, 0);
  }
  // techo captador con ondulacion (canales)
  const techoGeo = new THREE.PlaneGeometry(4.6, 4.6, 8, 8);
  const tp = techoGeo.attributes.position;
  const tcol = new Float32Array(tp.count * 3);
  const cSeco = new THREE.Color(PAL.aceroClaro), cAgua = new THREE.Color(PAL.aguaVerde), _t = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    tp.setZ(i, Math.sin(tp.getX(i) * 2) * 0.06);
    _t.copy(cSeco); tcol[i * 3] = _t.r; tcol[i * 3 + 1] = _t.g; tcol[i * 3 + 2] = _t.b;
  }
  techoGeo.setAttribute("color", new THREE.BufferAttribute(tcol, 3));
  techoGeo.rotateX(-Math.PI / 2);
  techoGeo.computeVertexNormals();
  const techo = new THREE.Mesh(techoGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  techo.userData.noShadow = true;
  P(root, techo, 0, floors + 0.1, 0);

  // microturbinas en las esquinas: rueda de 8 lados con paletas
  const rotors = [];
  const corners = [[1.9, 1.9], [-1.9, 1.9], [1.9, -1.9], [-1.9, -1.9]];
  corners.forEach(([x, z]) => {
    P(root, Cyl(0.09, 0.09, 6, mat(PAL.aceroClaro, { transparent: true, opacity: 0.5 }), 8), x * 1.1, 3, z * 1.1).userData.noShadow = true;
    const rot = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const bl = B(0.03, 0.02, 0.26, umat(PAL.maderaClara, { emissive: PAL.atardecer, emissiveIntensity: 0.6 }));
      bl.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13);
      bl.rotation.y = a;
      rot.add(bl);
    }
    rot.position.set(x * 1.1, 3, z * 1.1);
    rot.traverse((o) => { o.userData.noShadow = true; });
    root.add(rot);
    rotors.push(rot);
  });

  // tanque semitransparente + nivel interno
  P(root, Cyl(0.7, 0.7, 1.4, mat(PAL.aceroClaro, { transparent: true, opacity: 0.26 }), 10), -3.6, 0.7, 1.8).userData.noShadow = true;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 10), umat(PAL.azulBogota, { transparent: true, opacity: 0.8 }));
  water.userData.noShadow = true;
  root.add(water);

  // rack de servidores: color emissive del frente por temperatura
  P(root, ChB(4.4, 1.5, 2.4, mat(PAL.aceroOscuro), 0.08), 5.2, 0.75, 0);
  const racks = [];
  for (let i = 0; i < 5; i++) {
    const r = B(0.5, 1, 0.5, umat(PAL.azulBogota, { emissive: PAL.azulBogota, emissiveIntensity: 0.5 }));
    P(root, r, 3.7 + i * 0.75, 0.5, 1.6);
    racks.push(r);
  }
  // tuberias de refrigeracion (cilindros azules de 6 lados)
  const cool = Cyl(0.08, 0.08, 8, mat(PAL.azulBogota), 6);
  cool.rotation.z = Math.PI / 2;
  P(root, cool, 1, 0.4, 2.2);

  const rain = makeRain(root, { n: 300, area: 12, yTop: 13 });

  racks.forEach((r, i) => { r.userData.tip = "Rack de servidores " + (i + 1) + ": color por temperatura (azul frio a rojo caliente)"; });
  water.userData.tip = "Deposito de agua lluvia captada";
  rotors.forEach((r) => { r.userData.tip = "Microturbina en el bajante: gira con el caudal y genera"; });

  enableShadows(root);

  const cCold = new THREE.Color(PAL.azulBogota), cHot = new THREE.Color("#EF4444"), _tmp = new THREE.Color();
  return {
    cam: { radius: 13.5, phi: 1.05, theta: 0.7, target: [0.6, 2.8, 0], auto: 0.05, minR: 6, maxR: 28 },
    update(dt) {
      const d = rt.data || {};
      const rpm = d.rpm || 0;
      const rk = d.rain || 0;
      world.setHour(12, clamp01(0.3 + rk / 40));

      rotors.forEach((r, i) => { r.rotation.z += dt * (rpm / 60) * Math.PI * 2 * 0.35 * (i % 2 ? 1 : -1); });
      rain.step(dt, rk / 22);

      // techo: seco -> mojado
      const wet = clamp01(rk / 20);
      const arr = techoGeo.attributes.color.array;
      for (let i = 0; i < arr.length; i += 3) {
        _tmp.copy(cSeco).lerp(cAgua, wet);
        arr[i] += (_tmp.r - arr[i]) * 0.05; arr[i + 1] += (_tmp.g - arr[i + 1]) * 0.05; arr[i + 2] += (_tmp.b - arr[i + 2]) * 0.05;
      }
      techoGeo.attributes.color.needsUpdate = true;

      // rack por temperatura
      const tk = clamp01(((d.tcpu !== undefined ? d.tcpu : 50) - 45) / 40);
      racks.forEach((r, i) => {
        _tmp.copy(cCold).lerp(cHot, clamp01(tk + Math.sin(i) * 0.05));
        r.material.color.copy(_tmp);
        r.material.emissive.copy(_tmp);
        r.material.emissiveIntensity = 0.4 + tk * 0.6;
      });

      // nivel del tanque
      const lv = clamp01((d.nivel !== undefined ? d.nivel : 50) / 100);
      water.scale.y = Math.max(0.05, lv);
      water.position.set(-3.6, 0.02 + (lv * 1.3) / 2, 1.8);
    },
  };
}
