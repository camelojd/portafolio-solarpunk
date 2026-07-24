import * as THREE from "three";
import { PAL, mat, umat, semaforo, SEM } from "../palette.js";
import { makeWorld, makeCerros, enableShadows, P, B, Cyl, Ico, ChB, scatter, clamp01 } from "../core.js";

/* ================================================================
   SOL-TERRAZA DT: hidroponia urbana en una terraza de Bogota.
   Los cerros al fondo son la firma visual. Las plantas crecen.
   ================================================================ */
export function buildSol(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 12, sunR: 24 });
  makeCerros(root, { z: -36, s: 0.85 });

  // terraza de cemento + base de edificio en terracota
  P(root, ChB(10, 0.5, 7, mat(PAL.cemento), 0.1), 0, 0.25, 0);
  P(root, B(10, 1.2, 1, mat(PAL.terracota)), 0, -0.4, -3.5);
  // baranda: barras cilindricas delgadas
  for (let i = 0; i <= 10; i++) P(root, Cyl(0.035, 0.035, 0.7, mat(PAL.aceroClaro), 6), -5 + i, 0.85, 3.4);
  P(root, B(10, 0.06, 0.06, mat(PAL.aceroClaro)), 0, 1.2, 3.4);

  // torres hidroponicas: cilindros de 8 lados con aberturas por geometria
  const plantMat = umat(PAL.hoja, { emissive: PAL.musgo, emissiveIntensity: 0.08 });
  const torres = [];
  const plantItems = [];
  for (let i = 0; i < 5; i++) {
    const x = -3.2 + i * 1.6;
    P(root, Cyl(0.2, 0.24, 1.7, mat(PAL.blanco), 8), x, 1.35, -0.8);
    P(root, ChB(0.55, 0.14, 0.55, mat(PAL.aceroClaro), 0.05), x, 0.57, -0.8);
    for (let j = 0; j < 8; j++) {
      const a = j * 0.9;
      plantItems.push({ x: x + Math.cos(a) * 0.26, y: 0.8 + j * 0.14, z: -0.8 + Math.sin(a) * 0.26, s: 1 });
    }
    torres.push(x);
  }
  // plantas: icosaedros achatados, instanciados; su escala crece con los dias
  const plantGeo = new THREE.IcosahedronGeometry(0.11, 0);
  plantGeo.scale(1, 0.7, 1);
  const plants = scatter(root, plantGeo, plantMat, plantItems);

  // panel solar inclinado (latitud ~5N)
  const pv = B(2.2, 0.07, 1.4, umat(PAL.panelSolar, { emissive: PAL.azulBogota, emissiveIntensity: 0.2 }));
  pv.rotation.x = -0.09;
  P(root, pv, 3.4, 1.05, 1.6);
  P(root, Cyl(0.05, 0.05, 0.6, mat(PAL.aceroClaro), 6), 3.4, 0.75, 1.6);

  // bateria con barra de carga
  P(root, ChB(0.55, 0.7, 0.45, mat(PAL.aceroOscuro), 0.05), -4.2, 0.85, 2.2);
  const batFill = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.3), umat(PAL.hoja, { emissive: PAL.hoja, emissiveIntensity: 0.5 }));
  batFill.userData.noShadow = true;
  root.add(batFill);

  // reservorio: caja + nivel de agua interno
  P(root, Cyl(0.55, 0.55, 1.1, mat(PAL.aceroClaro, { transparent: true, opacity: 0.28 }), 10), -2.6, 1.05, 2.2).userData.noShadow = true;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1, 10), umat(PAL.azulBogota, { transparent: true, opacity: 0.8 }));
  water.userData.noShadow = true;
  root.add(water);

  // sensores de color
  [PAL.terracota, PAL.azulBogota, PAL.aguaVerde].forEach((c, i) => {
    const s = Ico(0.08, umat(c, { emissive: c, emissiveIntensity: 0.5 }), 1);
    s.userData.noShadow = true;
    P(root, s, -3.2 + i * 1.6, 0.68, -1.1);
  });

  // mallas raschel atrapaniebla: paneles verticales semitransparentes en marcos,
  // orientados al viento andino. Capturan agua de la neblina hacia el reservorio.
  const mallas = [];
  const mallaMat = umat(PAL.aguaVerde, { transparent: true, opacity: 0.34, side: THREE.DoubleSide });
  const gotasMat = umat(PAL.cieloClaro, { transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  [-3.0, 0.4].forEach((mx) => {
    const g = new THREE.Group();
    // marco de dos postes + travesaños
    P(g, Cyl(0.045, 0.045, 2.0, mat(PAL.aceroClaro), 6), -1.35, 1.4, 0);
    P(g, Cyl(0.045, 0.045, 2.0, mat(PAL.aceroClaro), 6), 1.35, 1.4, 0);
    P(g, B(2.8, 0.05, 0.05, mat(PAL.aceroClaro)), 0, 2.35, 0);
    P(g, B(2.8, 0.05, 0.05, mat(PAL.aceroClaro)), 0, 0.55, 0);
    // paño de malla
    const pano = B(2.65, 1.7, 0.02, mallaMat);
    pano.userData.noShadow = true;
    P(g, pano, 0, 1.45, 0);
    // brillo de gotas capturadas (visible cuando hay neblina)
    const gotas = B(2.6, 1.6, 0.03, gotasMat);
    gotas.userData.noShadow = true;
    gotas.visible = false;
    P(g, gotas, 0, 1.45, 0.02);
    g.position.set(mx, 0, 3.3);
    g.rotation.y = -0.12;
    g.userData.tip = "Malla raschel atrapaniebla: captura agua de la neblina hacia el reservorio";
    root.add(g);
    mallas.push({ g, gotas });
  });

  // neblina andina: puntos que caen (activada por comando)
  const nD = 140;
  const dPos = new Float32Array(nD * 3);
  for (let i = 0; i < nD; i++) { dPos[i * 3] = -3.5 + Math.random() * 7; dPos[i * 3 + 1] = 0.8 + Math.random() * 2.2; dPos[i * 3 + 2] = -1.5 + Math.random() * 5; }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({ color: "#E8F2EC", size: 0.06, transparent: true, opacity: 0, depthWrite: false });
  const fogPts = new THREE.Points(dGeo, dMat);
  fogPts.userData.noShadow = true;
  root.add(fogPts);

  pv.userData.tip = "Panel FV 400 Wp. Brilla segun la irradiancia";
  batFill.userData.tip = "Bateria AGM. Verde cargada, roja baja";
  water.userData.tip = "Reservorio: sube con la neblina atrapada, baja con el riego";
  plants.userData.tip = "Cultivo hidroponico. Color por salud, crece con los dias";

  enableShadows(root);

  const _tmp = new THREE.Color();
  const cGood = new THREE.Color(PAL.hoja);
  const cLow = new THREE.Color(SEM.critico);
  let growth = 0.7;

  return {
    cam: { radius: 10.5, phi: 1.02, theta: 0.8, target: [0, 1, 0], auto: 0.06, minR: 5, maxR: 24 },
    update(dt, t) {
      const d = rt.data || {};
      world.setHour(d.hour !== undefined ? d.hour : 12, d.fog ? 0.35 : 0);

      // salud de las plantas por severidad; escala crece lentamente (dias simulados)
      const sev = d.sev !== undefined ? d.sev : clamp01((d.ph !== undefined ? Math.abs(d.ph - 6.1) / 1.2 : 0.2));
      semaforo(clamp01(sev), _tmp);
      plantMat.color.lerp(_tmp, 0.05);
      plantMat.emissive.copy(plantMat.color).multiplyScalar(0.3);
      // las plantas crecen a lo largo de los dias simulados
      growth = clamp01(growth + dt * 0.004);
      const gScale = 0.55 + growth * 1.1;
      if (Math.abs(gScale - (plants.userData.gs || 0)) > 0.01) {
        plants.userData.gs = gScale;
        const M4 = new THREE.Matrix4();
        plantItems.forEach((it, i) => {
          M4.makeScale(gScale, gScale, gScale);
          M4.setPosition(it.x, it.y, it.z);
          plants.setMatrixAt(i, M4);
        });
        plants.instanceMatrix.needsUpdate = true;
      }
      // pv brilla con la irradiancia
      const irr = d.irr || 0;
      pv.material.emissiveIntensity = 0.1 + clamp01(irr / 900) * 0.8;

      // bateria
      const soc = (d.soc !== undefined ? d.soc : 50) / 100;
      batFill.scale.y = Math.max(0.04, soc * 0.62);
      batFill.position.set(-4.2, 0.55 + (soc * 0.62) / 2, 2.2);
      _tmp.copy(cLow).lerp(cGood, soc);
      batFill.material.color.copy(_tmp);
      batFill.material.emissive.copy(_tmp).multiplyScalar(0.5);

      // nivel del reservorio
      const lv = clamp01((d.nivel !== undefined ? d.nivel : 50) / 100);
      water.scale.y = Math.max(0.05, lv);
      water.position.set(-2.6, 0.52 + lv / 2, 2.2);

      // neblina
      dMat.opacity += ((d.fog ? 0.8 : 0) - dMat.opacity) * 0.06;
      fogPts.visible = dMat.opacity > 0.03;
      if (fogPts.visible) {
        const a = dGeo.attributes.position.array;
        for (let i = 0; i < nD; i++) { a[i * 3 + 1] -= dt * 0.8; if (a[i * 3 + 1] < 0.6) a[i * 3 + 1] = 3; }
        dGeo.attributes.position.needsUpdate = true;
      }
      // las mallas brillan con las gotas capturadas cuando hay neblina
      mallas.forEach((m) => {
        m.gotas.visible = dMat.opacity > 0.06;
        m.gotas.material.opacity = 0.25 + dMat.opacity * 0.5 + Math.abs(Math.sin(t * 2)) * 0.1;
      });
    },
  };
}
