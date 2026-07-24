import * as THREE from "three";
import { PAL, mat, umat, SEM } from "../palette.js";
import { makeWorld, makePiso, plantTrees, enableShadows, P, B, ChB, clamp01, rnd } from "../core.js";

/* ================================================================
   SOLAR-EDIFICIO DT: balance energetico Net Zero.
   Paneles que se iluminan con la generacion, sol en arco real,
   heatmap de radiacion en la fachada, bateria con barra de carga.
   ================================================================ */
export function buildSolarEd(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 14, sunR: 26 });
  makePiso(root, 26, 22, PAL.hoja);
  plantTrees(root, Array.from({ length: 8 }, () => ({ x: rnd(-11, 11), y: 0.05, z: (Math.random() < 0.5 ? 1 : -1) * rnd(6, 9), s: rnd(1.6, 2.6), ry: rnd(0, 6) })));

  // edificio: prisma achaflanado con fachadas (heatmap por radiacion)
  P(root, ChB(9, 0.3, 8, mat(PAL.cemento), 0.1), 0, 0.15, 0);
  const FL = 3;
  const facades = [];
  for (let f = 0; f < FL; f++) {
    P(root, ChB(7.2, 0.24, 6.4, mat(PAL.arena), 0.08), 0, 0.3 + f * 2.4, 0);
    [[0, 3.2, 0], [0, -3.2, Math.PI], [3.6, 0, Math.PI / 2], [-3.6, 0, -Math.PI / 2]].forEach(([x, z, ry]) => {
      const w = Math.abs(ry) > 0.1 && Math.abs(ry) < 3 ? 6.4 : 7.2;
      const fa = B(w, 2.1, 0.12, umat(PAL.azulBogota, { emissive: PAL.azulBogota, emissiveIntensity: 0.2 }));
      fa.rotation.y = ry;
      P(root, fa, x, 1.45 + f * 2.4, z);
      facades.push({ m: fa, dir: new THREE.Vector3(x, 0, z).normalize() });
    });
  }
  P(root, ChB(7.6, 0.2, 6.8, mat(PAL.aceroOscuro), 0.06), 0, 0.3 + FL * 2.4, 0);

  // paneles solares en grilla, inclinados para lat ~5N, instanciados
  const pvGeo = B(2, 0.06, 2.4, umat(PAL.panelSolar, { emissive: PAL.azulBogota, emissiveIntensity: 0.2 })).geometry;
  const pvMat = umat(PAL.panelSolar, { emissive: PAL.azulBogota, emissiveIntensity: 0.2 });
  const pvItems = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) pvItems.push({ x: -2.2 + i * 2.2, y: 0.62 + FL * 2.4, z: -1.4 + j * 2.8 });
  // paneles como grupo de mallas (para animar emissive comun)
  const pvs = [];
  pvItems.forEach((it) => {
    const p = new THREE.Mesh(pvGeo, pvMat);
    p.rotation.x = -0.09;
    p.userData.noShadow = true;
    P(root, p, it.x, it.y, it.z);
    P(root, B(0.05, 0.35, 0.05, mat(PAL.aceroClaro)), it.x, it.y - 0.2, it.z);
    pvs.push(p);
  });

  // bateria LFP con barra de carga
  P(root, ChB(0.8, 1, 0.5, mat(PAL.aceroOscuro), 0.06), 4.6, 0.5, 2.6);
  const batFill = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.36), umat(SEM.ok, { emissive: SEM.ok, emissiveIntensity: 0.5 }));
  batFill.userData.noShadow = true;
  root.add(batFill);

  // flujo de energia: flechas animadas paneles -> edificio -> red
  const arrows = [];
  for (let i = 0; i < 14; i++) {
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 5), umat(PAL.aguaVerde, { emissive: PAL.aguaVerde, emissiveIntensity: 1 }));
    a.rotation.z = -Math.PI / 2;
    a.userData = { s: i / 14, lane: i % 3, fl: Math.floor(i / 5) };
    a.userData.noShadow = true;
    a.visible = false;
    root.add(a);
    arrows.push(a);
  }

  pvs.forEach((p) => { p.userData.tip = "Paneles FV. Se iluminan con la generacion en tiempo real"; });
  batFill.userData.tip = "Bateria LFP. Barra y color por estado de carga";
  facades.forEach((f) => { f.m.userData.tip = "Fachada: heatmap de radiacion solar (azul sombra a rojo alta)"; });

  enableShadows(root);

  const cCold = new THREE.Color(PAL.azulBogota), cHot = new THREE.Color(SEM.critico), cG = new THREE.Color(SEM.ok);
  const cLow = new THREE.Color(SEM.critico);
  const _tmp = new THREE.Color();
  return {
    cam: { radius: 16, phi: 1.02, theta: 0.72, target: [0, 3.4, 0], auto: 0.05, minR: 7, maxR: 32 },
    update(dt) {
      const d = rt.data || {};
      const hour = d.hour !== undefined ? d.hour : 12;
      const irr = d.irr || 0;
      const dayK = clamp01(irr / 700);
      world.setHour(hour, 0);

      // heatmap de radiacion en fachadas segun angulo al sol
      const sdir = world.sun.position.clone().normalize();
      facades.forEach((f) => {
        const inc = clamp01(f.dir.dot(sdir)) * dayK;
        _tmp.copy(cCold).lerp(cHot, inc);
        f.m.material.color.copy(_tmp);
        f.m.material.emissive.copy(_tmp);
        f.m.material.emissiveIntensity = 0.12 + inc * 0.85;
      });

      // paneles se iluminan con la generacion
      const fvK = clamp01((d.fv || 0) / 13);
      _tmp.copy(cCold).lerp(cG, fvK);
      pvMat.emissive.copy(_tmp);
      pvMat.emissiveIntensity = 0.1 + fvK * 0.9;

      // bateria
      const soc = (d.soc !== undefined ? d.soc : 50) / 100;
      batFill.scale.y = Math.max(0.04, soc * 0.86);
      batFill.position.set(4.6, 0.06 + (soc * 0.86) / 2, 2.6);
      _tmp.copy(cLow).lerp(cG, soc);
      batFill.material.color.copy(_tmp);
      batFill.material.emissive.copy(_tmp);

      // flujo de energia proporcional al balance
      const bal = d.balance !== undefined ? d.balance : 0;
      const flow = Math.abs(bal) > 0.1;
      const genera = bal >= 0;
      const spd = clamp01(Math.abs(bal) / 5);
      _tmp.set(genera ? SEM.ok : SEM.alerta);
      arrows.forEach((a) => {
        a.visible = flow;
        if (flow) {
          a.userData.s = (a.userData.s + dt * (0.2 + spd) * (genera ? 0.5 : -0.5) + 1) % 1;
          a.position.set(-4.4 + a.userData.s * 8.8, 1.45 + a.userData.fl * 2.4, -1.8 + a.userData.lane * 1.8);
          a.material.color.copy(_tmp);
          a.material.emissive.copy(_tmp);
          a.rotation.z = genera ? -Math.PI / 2 : Math.PI / 2;
        }
      });
    },
  };
}
