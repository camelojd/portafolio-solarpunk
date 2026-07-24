import * as THREE from "three";
import { PAL, mat, umat, C_OK, C_AVISO, C_CRITICO } from "../palette.js";
import { makeWorld, makePiso, plantTrees, enableShadows, P, B, Cyl, Cono, ChB, chGeo, clamp01, rnd } from "../core.js";

/* ================================================================
   CICLO-OBRA DT: trazabilidad RFID de materiales.
   Bascula que se hunde, etiqueta que parpadea al escanear,
   material que fluye por estaciones, portico escaner.
   ================================================================ */
export function buildCiclo(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 16, sunR: 26 });
  world.setHour(10);
  makePiso(root, 26, 16, PAL.cemento);
  plantTrees(root, Array.from({ length: 6 }, () => ({ x: rnd(-12, 12), y: 0.05, z: (Math.random() < 0.5 ? 1 : -1) * rnd(5, 7), s: rnd(1.4, 2.2), ry: rnd(0, 6) })));

  // bascula: plataforma achaflanada que se hunde al recibir material
  const bascula = ChB(2.2, 0.2, 2.2, mat(PAL.aceroOscuro), 0.06);
  P(root, bascula, -8.4, 0.2, 0);
  // portico escaner RFID
  P(root, Cyl(0.07, 0.07, 3.2, mat(PAL.aceroClaro), 6), -9.6, 1.6, 1.2);
  P(root, Cyl(0.07, 0.07, 3.2, mat(PAL.aceroClaro), 6), -9.6, 1.6, -1.2);
  P(root, B(0.16, 0.16, 2.6, mat(PAL.aceroClaro)), -9.6, 3.2, 0);
  // plano de luz verde que barre
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), umat(C_OK.getStyle(), { transparent: true, opacity: 0.25, emissive: C_OK.getStyle(), emissiveIntensity: 0.8, side: THREE.DoubleSide }));
  beam.rotation.y = Math.PI / 2;
  beam.userData.noShadow = true;
  P(root, beam, -9.6, 1.6, 0);

  // materiales por tipo (color plano identifica): ladrillos, vigas, sacos, arena
  // ladrillos apilados (instanciados)
  const brickGeo = chGeo(0.3, 0.16, 0.5, 0.03);
  const brickItems = [];
  for (let i = 0; i < 12; i++) brickItems.push({ x: -4.6 + (i % 3) * 0.34, y: 0.28 + Math.floor(i / 3) * 0.18, z: -3.4 });
  const bricks = new THREE.InstancedMesh(brickGeo, mat(PAL.terracota), brickItems.length);
  const M4 = new THREE.Matrix4();
  brickItems.forEach((it, i) => { M4.makeTranslation(it.x, it.y, it.z); bricks.setMatrixAt(i, M4); });
  bricks.castShadow = true; bricks.receiveShadow = true;
  root.add(bricks);
  // vigas de acero
  for (let i = 0; i < 3; i++) P(root, B(2.4, 0.12, 0.16, mat(PAL.aceroClaro)), -2.2, 0.3 + i * 0.14, -3.4);
  // sacos de cemento
  for (let i = 0; i < 4; i++) P(root, ChB(0.5, 0.3, 0.36, mat(PAL.arena), 0.08), 0.4 + (i % 2) * 0.55, 0.3 + Math.floor(i / 2) * 0.32, -3.4);
  // arena: cono achatado
  const arena = Cono(0.8, 0.7, mat(PAL.maderaClara), 8);
  P(root, arena, 3, 0.35, -3.4);

  // contenedores de residuos con etiqueta RFID (4 tipos)
  const contColors = [PAL.maderaOscura, PAL.aceroClaro, PAL.azulBogota, PAL.musgo];
  const conts = [];
  contColors.forEach((c, i) => {
    const x = 0.4 + i * 2.1;
    P(root, B(1.5, 0.1, 1.3, mat(PAL.aceroOscuro)), x, 0.3, 3);
    const shell = ChB(1.5, 1.3, 1.3, mat(c, { transparent: true, opacity: 0.4 }), 0.06);
    shell.userData.noShadow = true;
    P(root, shell, x, 0.98, 3);
    const fill = new THREE.Mesh(new THREE.BoxGeometry(1.34, 1.16, 1.14), umat(c, { emissive: c, emissiveIntensity: 0.2 }));
    fill.userData.noShadow = true;
    root.add(fill);
    // etiqueta RFID (parpadea verde al escanear)
    const tag = B(0.2, 0.14, 0.02, umat(PAL.maderaClara, { emissive: PAL.maderaClara, emissiveIntensity: 0.8 }));
    tag.userData.noShadow = true;
    P(root, tag, x, 1.5, 3.66);
    conts.push({ fill, tag, x, color: new THREE.Color(c) });
  });

  // camion de despacho
  P(root, ChB(3.4, 2.2, 3, mat(PAL.aceroOscuro), 0.08), 8.2, 1.1, -2.6);
  const truck = new THREE.Group();
  P(truck, ChB(1.7, 0.7, 0.9, mat(PAL.aceroOscuro), 0.06), 0, 0.6, 0);
  P(truck, ChB(0.6, 0.6, 0.85, mat(PAL.azulBogota), 0.05), 1.1, 0.55, 0);
  const load = ChB(1.4, 0.5, 0.75, umat(PAL.maderaOscura), 0.05);
  load.position.set(-0.1, 1.15, 0);
  truck.add(load);
  truck.visible = false;
  truck.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  root.add(truck);

  // material que fluye por estaciones (lerp)
  const flows = [];
  for (let i = 0; i < 8; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), umat(PAL.maderaClara, { emissive: PAL.maderaClara, emissiveIntensity: 1 }));
    f.userData = { s: i / 8 };
    f.userData.noShadow = true;
    root.add(f);
    flows.push(f);
  }

  bascula.userData.tip = "Bascula con RFID: pesa cada lote al entrar";
  conts.forEach((c, i) => { c.tag.userData.tip = "Contenedor de residuos " + (i + 1) + ": etiqueta RFID, semaforo por llenado"; });
  truck.userData.tip = "Despacho a gestor autorizado con cadena de custodia";

  enableShadows(root);

  const _tmp = new THREE.Color();
  const pA = new THREE.Vector3(-8.4, 1.4, 0), pB = new THREE.Vector3(-3, 2.6, -3.4), pC = new THREE.Vector3(3.5, 1.2, 1.6);
  return {
    cam: { radius: 17, phi: 1.0, theta: 0.72, target: [0, 1.2, 0], auto: 0.05, minR: 7, maxR: 34 },
    update(dt, t) {
      const d = rt.data || {};

      // barrido del escaner
      beam.material.emissiveIntensity = 0.5 + Math.abs(Math.sin(t * 2)) * 0.6;
      beam.position.x = -10.6 + ((t * 1.2) % 2);

      // bascula se hunde con el recibido
      const recibido = d.recibido !== undefined ? d.recibido : 0;
      bascula.position.y = 0.2 - clamp01((recibido % 5) / 5) * 0.04;

      // etiquetas RFID parpadean; contenedores por llenado -> semaforo
      const resid = d.resid !== undefined ? d.resid : 40;
      conts.forEach((c, i) => {
        const lv = clamp01((resid + i * 5) / 100);
        c.fill.scale.y = Math.max(0.05, lv);
        c.fill.position.set(c.x, 0.36 + (lv * 1.16) / 2, 3);
        const tgt = lv > 0.85 ? C_CRITICO : lv > 0.6 ? C_AVISO : C_OK;
        c.tag.material.color.lerp(tgt, 0.1);
        c.tag.material.emissive.copy(c.tag.material.color);
        c.tag.material.emissiveIntensity = 0.5 + Math.abs(Math.sin(t * 5 + i)) * 0.9;
      });

      // camion recorre entrada -> despacho en bucle
      const ts = (t * 0.12) % 1;
      truck.visible = true;
      const from = new THREE.Vector3(0.4, 0, 3), to = new THREE.Vector3(8.2, 0, -2.2);
      truck.position.lerpVectors(from, to, ts);
      truck.rotation.y = Math.atan2(to.x - from.x, to.z - from.z) - Math.PI / 2;

      // flujo de material por estaciones
      flows.forEach((f) => {
        f.userData.s = (f.userData.s + dt * 0.16) % 1;
        const u = f.userData.s * 2;
        const p = u < 1 ? pA.clone().lerp(pB, u) : pB.clone().lerp(pC, u - 1);
        p.y += Math.sin(f.userData.s * Math.PI) * 0.5;
        f.position.copy(p);
      });
    },
  };
}
