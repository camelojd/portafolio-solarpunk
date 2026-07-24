import * as THREE from "three";
import { PAL, mat, umat, semaforo, C_OK, SEM } from "../palette.js";
import { makeWorld, makePiso, makeCerros, plantTrees, makeAuto, enableShadows, P, B, Cyl, ChB, clamp01, rnd } from "../core.js";

/* ================================================================
   FIBRA-VIA DT: pavimento piezoelectrico.
   Modulos que se hunden y encienden al paso; postes verde/rojo.
   ================================================================ */
export function buildFibra(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 16, sunR: 30 });
  makeCerros(root, { z: -44, s: 0.9 });
  makePiso(root, 36, 20, PAL.hoja);
  plantTrees(root, Array.from({ length: 8 }, () => ({ x: rnd(-11, 11), y: 0.05, z: (Math.random() < 0.5 ? 1 : -1) * rnd(3.2, 7), s: rnd(1.6, 2.4), ry: rnd(0, 6) })));

  // via: plano alargado en asfalto + linea central punteada por geometria
  const segs = [];
  const segW = 2.3;
  for (let i = 0; i < 10; i++) {
    const b = B(segW - 0.06, 0.14, 3, umat(PAL.asfalto));
    P(root, b, -11.5 + segW / 2 + i * segW, 0.08, 0);
    segs.push(b);
  }
  for (let i = 0; i < 14; i++) P(root, B(0.7, 0.02, 0.08, mat(PAL.blanco)), -9.7 + i * 1.5, 0.165, 0);

  // modulos piezoelectricos empotrados: se hunden y encienden
  const mods = [];
  for (let x = -9; x <= 9; x += 1.5) [0.8, -0.8].forEach((z) => {
    const m = B(0.34, 0.06, 0.34, umat(PAL.aceroClaro, { emissive: SEM.ok, emissiveIntensity: 0 }));
    P(root, m, x, 0.16, z);
    mods.push({ m, x, z, f: 0, baseY: 0.16 });
  });

  // postes de luz: LED verde (piezo) o rojo (red)
  const lamps = [];
  for (let i = 0; i < 5; i++) {
    const x = -8 + i * 4, side = i % 2 ? 1 : -1;
    P(root, Cyl(0.05, 0.07, 1.8, mat(PAL.aceroOscuro), 6), x, 0.9, side * 2.2);
    P(root, B(0.06, 0.05, 0.7, mat(PAL.aceroOscuro)), x, 1.8, side * 1.9);
    const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), umat(C_OK.getStyle(), { emissive: C_OK.getStyle(), emissiveIntensity: 0 }));
    bulb.userData.noShadow = true;
    P(root, bulb, x, 1.76, side * 1.55);
    lamps.push(bulb);
  }

  // bateria LFP
  P(root, ChB(0.7, 0.8, 0.6, mat(PAL.aceroOscuro), 0.05), -10.8, 0.4, 2.4);
  const batFill = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.42), umat(SEM.ok, { emissive: SEM.ok, emissiveIntensity: 0.5 }));
  batFill.userData.noShadow = true;
  root.add(batFill);

  const vehicles = [];

  batFill.userData.tip = "Bateria LFP: guarda la energia piezoelectrica del trafico";
  lamps.forEach((l, i) => { l.userData.tip = "Luminaria " + (i + 1) + ": verde si la alimenta el piezo, roja si la red"; });
  segs.forEach((s, i) => { s.userData.tip = "Segmento " + (i + 1) + ": semaforo de deterioro del pavimento"; });

  enableShadows(root);

  const cLow = new THREE.Color(SEM.critico), cG = new THREE.Color(SEM.ok), _tmp = new THREE.Color();
  const vehCols = [PAL.terracota, PAL.azulBogota, PAL.maderaClara, PAL.aguaVerde, PAL.arena];
  return {
    cam: { radius: 14.5, phi: 0.98, theta: 1.1, target: [0, 0.4, 0], auto: 0.05, minR: 6, maxR: 30 },
    update(dt) {
      const d = rt.data || {};
      world.setHour(d.hour !== undefined ? d.hour : 12, 0);
      const lum = !!d.lum;
      const piezoON = (d.soc !== undefined ? d.soc : 50) > 15;  // alimentado por piezo si hay carga

      // spawnea vehiculos desde la cola de eventos
      while (rt.queue && rt.queue.length) {
        const q = rt.queue.shift();
        const largo = q.clase === "pesado" ? 1.6 : q.clase === "moto" ? 0.6 : 1.15;
        const g = makeAuto(vehCols[Math.floor(Math.random() * vehCols.length)], largo);
        const z = q.dir > 0 ? 0.8 : -0.8;
        g.position.set(q.dir > 0 ? -12 : 12, 0.08, z);
        if (q.dir < 0) g.rotation.y = Math.PI;
        root.add(g);
        vehicles.push({ g, dir: q.dir, z, speed: rnd(2.6, 3.8) * (q.clase === "moto" ? 1.25 : q.clase === "pesado" ? 0.75 : 1), clase: q.clase });
      }
      for (let i = vehicles.length - 1; i >= 0; i--) {
        const v = vehicles[i];
        v.g.position.x += v.dir * v.speed * dt;
        mods.forEach((mo) => {
          if (mo.z === v.z && Math.abs(mo.x - v.g.position.x) < 0.2) mo.f = Math.max(mo.f, v.clase === "pesado" ? 1 : v.clase === "moto" ? 0.3 : 0.55);
        });
        if (Math.abs(v.g.position.x) > 12.5) {
          root.remove(v.g);
          v.g.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
          vehicles.splice(i, 1);
        }
      }
      // modulos: se hunden y encienden con fade
      mods.forEach((mo) => {
        mo.f *= Math.pow(0.05, dt);
        mo.m.material.emissiveIntensity = mo.f * 2.6;
        mo.m.position.y = mo.baseY - mo.f * 0.03;
      });

      // postes: verde piezo / rojo red; brillo por trafico
      const traf = clamp01(vehicles.length / 6);
      lamps.forEach((l) => {
        l.material.color.lerp(piezoON ? cG : cLow, 0.08);
        l.material.emissive.copy(l.material.color);
        l.material.emissiveIntensity = lum ? 0.5 + traf * 1.4 : 0.05;
      });

      // deterioro por segmento (semaforo)
      const det = d.det || [];
      segs.forEach((sg, i) => {
        const val = (det[i] !== undefined ? det[i] : 8) / 100;
        semaforo(clamp01(val), _tmp);
        sg.material.color.lerp(val > 0.05 ? _tmp : new THREE.Color(PAL.asfalto), 0.05);
      });

      // bateria
      const soc = (d.soc !== undefined ? d.soc : 50) / 100;
      batFill.scale.y = Math.max(0.04, soc * 0.7);
      batFill.position.set(-10.8, 0.06 + (soc * 0.7) / 2, 2.4);
      _tmp.copy(cLow).lerp(cG, soc);
      batFill.material.color.copy(_tmp);
      batFill.material.emissive.copy(_tmp);
    },
  };
}
