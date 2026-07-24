import * as THREE from "three";
import { PAL, mat, umat, semaforo, C_OK, C_AVISO, C_CRITICO } from "../palette.js";
import { makeWorld, makePiso, enableShadows, P, B, ChB, chGeo } from "../core.js";

/* ================================================================
   ABASTO VIVO DT: logistica FEFO de banco de alimentos.
   El color de cada caja ES el dato de urgencia FEFO. AMRs con LED.
   ================================================================ */
export function buildAbasto(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 20, sunR: 26, noSunBall: true });
  world.setHour(11);

  // bodega: piso + paredes de plano simple + claraboyas
  makePiso(root, 20, 14, PAL.cemento);
  const wallMat = mat(PAL.arena);
  P(root, B(20, 5, 0.2, wallMat), 0, 2.5, -7).userData.noShadow = true;
  P(root, B(0.2, 5, 14, wallMat), -10, 2.5, 0).userData.noShadow = true;
  P(root, B(0.2, 5, 14, wallMat), 10, 2.5, 0).userData.noShadow = true;
  // claraboyas emissive en el techo (vigas de acero oscuro)
  for (let i = -1; i <= 1; i++) {
    P(root, B(18, 0.15, 0.9, umat(PAL.arena, { emissive: "#FFF3D6", emissiveIntensity: 0.5 })), 0, 4.9, i * 3.5).userData.noShadow = true;
    P(root, B(18, 0.25, 0.25, mat(PAL.aceroOscuro)), 0, 4.75, i * 1.7);
  }

  // estantes: modulos repetidos + cajas por urgencia FEFO
  const RACKX = [-6.2, -3.4, -0.6];
  const boxGeo = chGeo(0.58, 0.52, 0.58, 0.05);
  const boxes = [];
  const boxItems = [];
  RACKX.forEach((rx) => {
    for (let lv = 0; lv < 3; lv++) {
      P(root, B(2, 0.1, 5, mat(PAL.aceroClaro)), rx, 0.7 + lv * 1.15, -3);
      [-0.9, 0.9].forEach((o) => {
        P(root, B(0.12, 3.5, 0.12, mat(PAL.aceroOscuro)), rx + o, 1.75, -5.3);
        P(root, B(0.12, 3.5, 0.12, mat(PAL.aceroOscuro)), rx + o, 1.75, -0.7);
      });
      for (let b = 0; b < 6; b++) boxItems.push({ x: rx + (b % 2 ? 0.42 : -0.42), y: 1.03 + lv * 1.15, z: -5.1 + Math.floor(b / 2) * 1.4 });
    }
  });
  // cada caja tiene material propio: su color es la urgencia
  const boxInst = new THREE.InstancedMesh(boxGeo, mat(PAL.maderaClara).clone(), boxItems.length);
  const boxColorArr = new Float32Array(boxItems.length * 3);
  const M4 = new THREE.Matrix4();
  boxItems.forEach((it, i) => {
    M4.makeTranslation(it.x, it.y, it.z);
    boxInst.setMatrixAt(i, M4);
    const k = Math.random();
    const c = semaforo(k < 0.6 ? 0.1 : k < 0.85 ? 0.5 : 0.9);
    boxColorArr[i * 3] = c.r; boxColorArr[i * 3 + 1] = c.g; boxColorArr[i * 3 + 2] = c.b;
    boxes.push({ k });
  });
  boxInst.instanceColor = new THREE.InstancedBufferAttribute(boxColorArr, 3);
  boxInst.castShadow = true; boxInst.receiveShadow = true;
  root.add(boxInst);

  // muelle de despacho
  P(root, ChB(3, 1, 2.6, mat(PAL.aceroOscuro), 0.08), 6.4, 0.6, -2.4);
  P(root, B(3.1, 0.36, 2, umat(PAL.aguaVerde, { emissive: PAL.aguaVerde, emissiveIntensity: 0.4 })), 6.4, 1, -2.4).userData.noShadow = true;

  // estacion de carga con LEDs
  P(root, ChB(2.4, 0.12, 2, mat(PAL.aceroOscuro), 0.05), -8.4, 0.12, 3.6);
  const chargeLeds = [];
  for (let i = 0; i < 3; i++) {
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), umat(PAL.maderaClara, { emissive: PAL.maderaClara, emissiveIntensity: 1 }));
    l.userData.noShadow = true;
    P(root, l, -9.2 + i * 0.8, 0.3, 3.6);
    chargeLeds.push(l);
  }

  // AMRs: caja baja + 4 ruedas + barra LED superior
  const amrs = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    P(g, ChB(0.72, 0.24, 0.56, mat(PAL.azulBogota), 0.05), 0, 0.2, 0);
    const load = ChB(0.42, 0.36, 0.42, umat(PAL.maderaClara), 0.04);
    P(g, load, 0, 0.56, 0);
    const bar = B(0.5, 0.06, 0.42, umat(PAL.hoja, { emissive: PAL.hoja, emissiveIntensity: 1.2 }));
    bar.userData.noShadow = true;
    P(g, bar, 0, 0.42, 0);
    const wg = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
    wg.rotateZ(Math.PI / 2);
    [[-0.26, -0.2], [0.26, -0.2], [-0.26, 0.2], [0.26, 0.2]].forEach(([x, z]) => P(g, new THREE.Mesh(wg, mat(PAL.asfalto)), x, 0.1, z));
    g.traverse((o) => { if (o.isMesh && !o.userData.noShadow) { o.castShadow = true; o.receiveShadow = true; } });
    root.add(g);
    amrs.push({ g, load, bar });
  }

  // zona bloqueada (comando)
  const blockZone = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.4), umat(C_CRITICO.getStyle(), { transparent: true, opacity: 0.2, emissive: C_CRITICO.getStyle(), emissiveIntensity: 0.8, side: THREE.DoubleSide }));
  blockZone.rotation.x = -Math.PI / 2;
  blockZone.position.set(-3.4, 0.12, -3);
  blockZone.visible = false;
  blockZone.userData.noShadow = true;
  root.add(blockZone);

  boxInst.userData.tip = "Cajas de comida. El color es la urgencia FEFO: verde OK, rojo por vencer";
  amrs.forEach((a, i) => { a.g.userData.tip = "AMR " + (i + 1) + ": LED verde activo, ambar cargando, rojo bateria baja"; });

  enableShadows(root);

  const PICK = new THREE.Vector3(5.2, 0, -2.4);
  return {
    cam: { radius: 21, phi: 1.0, theta: 0.68, target: [0, 1, 0], auto: 0.05, minR: 8, maxR: 42 },
    update(dt, t) {
      const d = rt.data || {};
      const list = d.amrs || [];
      const blk = !!d.blk;
      blockZone.visible = blk;
      if (blk) blockZone.material.opacity = 0.12 + Math.abs(Math.sin(t * 3)) * 0.16;

      list.forEach((a, i) => {
        const v = amrs[i];
        if (!v) return;
        const rackP = new THREE.Vector3(RACKX[a.rack] || -3.4, 0, 0.4);
        let from, to;
        if (a.charging) { from = new THREE.Vector3(-9.2 + i * 0.5, 0, 3.6); to = from; }
        else if (a.phase === 0) { from = PICK.clone(); to = rackP; }
        else { from = rackP; to = PICK.clone(); }
        const way = new THREE.Vector3((from.x + to.x) / 2, 0, blk ? 5.2 : 1.6);
        const u = a.s;
        const p = u < 0.5 ? from.clone().lerp(way, u * 2) : way.clone().lerp(to, (u - 0.5) * 2);
        v.g.position.lerp(p, 0.25);
        const dir = to.clone().sub(from);
        if (dir.length() > 0.01) v.g.rotation.y = THREE.MathUtils.lerp(v.g.rotation.y, Math.atan2(dir.x, dir.z), 0.08);
        v.load.visible = a.phase === 1 && !a.charging;
        const bat = a.bat;
        const c = a.charging ? C_AVISO : bat < 30 ? C_CRITICO : C_OK;
        v.bar.material.color.lerp(c, 0.1);
        v.bar.material.emissive.copy(v.bar.material.color);
        v.bar.material.emissiveIntensity = a.charging ? 0.5 + Math.abs(Math.sin(t * 5)) * 0.9 : 1.2;
      });

      chargeLeds.forEach((l, i) => {
        const busy = list.filter((a) => a.charging).length > i;
        l.material.emissiveIntensity = busy ? 0.4 + Math.abs(Math.sin(t * 6 + i)) * 1.2 : 0.15;
      });
    },
  };
}
