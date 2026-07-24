import * as THREE from "three";
import { PAL, mat, umat, C_OK, C_AVISO, C_ALERTA, C_CRITICO } from "../palette.js";
import { makeWorld, makeCerros, makeRain, enableShadows, P, B, Cyl, ChB, chGeo, plantTrees, makeFlecha, rnd } from "../core.js";

/* ================================================================
   CANAL-ALERTA DT: alerta temprana de inundacion (Kennedy/Bosa).
   El agua sube, los sumideros se tapan, el barrio se tine en alerta.
   ================================================================ */
export function buildCanal(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 20, sunR: 30, shadowFar: 120, fogFar: 160 });
  makeCerros(root, { z: -44, s: 0.95 });

  // suelo urbano: asfalto con cuadricula de calles
  P(root, B(46, 0.1, 30, mat(PAL.asfalto)), 0, 0.05, 0).userData.noShadow = true;

  // manzanas: cajas bajas achaflanadas, instanciadas (colores variados de la paleta)
  const manzColors = [PAL.terracota, PAL.arena, PAL.musgo, PAL.maderaClara, PAL.aceroClaro];
  const manzMats = manzColors.map((c) => mat(c));
  const manzGeo = chGeo(1.7, 1, 1.5, 0.08);
  const manzGroups = manzColors.map(() => []);
  const grid = [];
  for (let gx = -9; gx <= 9; gx += 3) {
    for (let gz = -10; gz <= 10; gz += 3.2) {
      if (Math.abs(gz) < 2.2) continue; // deja el canal libre
      grid.push({ x: gx + rnd(-0.3, 0.3), z: gz + rnd(-0.3, 0.3), h: 1 + (Math.random() * 1.6) });
    }
  }
  // agrupa por color para instanciar barato; cada instancia con su altura
  grid.forEach((c, i) => manzGroups[i % manzColors.length].push(c));
  const manzInst = [];
  manzGroups.forEach((items, ci) => {
    const im = new THREE.InstancedMesh(manzGeo, manzMats[ci].clone(), items.length);
    const M4 = new THREE.Matrix4();
    items.forEach((it, i) => { M4.makeScale(1, it.h, 1); M4.setPosition(it.x, (it.h) / 2 * 1 + 0.05, it.z); im.setMatrixAt(i, M4); });
    im.castShadow = true; im.receiveShadow = true;
    root.add(im);
    manzInst.push({ im, items, baseColor: new THREE.Color(manzColors[ci]) });
  });

  // canal en trinchera atravesando la escena
  P(root, B(40, 0.5, 0.3, mat(PAL.cemento)), 0, 0.25, -1.55);
  P(root, B(40, 0.5, 0.3, mat(PAL.cemento)), 0, 0.25, 1.55);
  P(root, B(40, 0.08, 2.8, mat("#2B3A42")), 0, 0.06, 0).userData.noShadow = true;
  // agua del canal: superficie con ondulacion, sube con el nivel
  const canalGeo = new THREE.PlaneGeometry(39.8, 2.75, 40, 3);
  canalGeo.rotateX(-Math.PI / 2);
  const agua = new THREE.Mesh(canalGeo, umat(PAL.aguaProfunda, { transparent: true, opacity: 0.85 }));
  agua.userData.noShadow = true;
  agua.position.y = 0.1;
  root.add(agua);
  const baseCY = canalGeo.attributes.position.array.slice();

  // agua desbordada en calles: planos semitransparentes que crecen
  const flood = new THREE.Mesh(new THREE.PlaneGeometry(46, 30), umat(PAL.azulBogota, { transparent: true, opacity: 0, side: THREE.DoubleSide }));
  flood.rotation.x = -Math.PI / 2;
  flood.userData.noShadow = true;
  P(root, flood, 0, 0.12, 0);

  // sumideros: cilindros en los cruces (verde despejado, rojo tapado)
  const sumids = [];
  for (let i = 0; i < 6; i++) {
    const x = -10 + i * 4;
    const s = Cyl(0.22, 0.26, 0.16, umat(PAL.hoja, { emissive: PAL.hoja, emissiveIntensity: 0.6 }), 8);
    s.userData.noShadow = true;
    P(root, s, x, 0.14, -2.4);
    sumids.push(s);
  }

  // estacion de sensor + barra vertical de nivel
  P(root, Cyl(0.05, 0.06, 2.1, mat(PAL.aceroOscuro), 6), 9.2, 1.05, -2.6);
  P(root, ChB(0.5, 0.36, 0.3, mat(PAL.asfalto), 0.05), 9.2, 2.2, -2.6);
  const sirena = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), umat(PAL.hoja, { emissive: PAL.hoja, emissiveIntensity: 1.2 }));
  sirena.userData.noShadow = true;
  P(root, sirena, 9.2, 2.62, -2.6);
  // regla de nivel a color
  const nivBar = [];
  ["#22C55E", "#EAB308", "#F97316", "#EF4444"].forEach((c, i) => {
    const seg = B(0.14, 0.28, 0.05, umat(c, { emissive: c, emissiveIntensity: 0.2 }));
    seg.userData.noShadow = true;
    P(root, seg, 7, 0.25 + i * 0.3, -1.35);
    nivBar.push(seg);
  });

  // flecha de evacuacion (aparece en alerta)
  const evac = makeFlecha(C_CRITICO.getStyle());
  evac.rotation.y = Math.PI / 2;
  evac.position.set(4, 2.4, 4);
  evac.visible = false;
  root.add(evac);

  // arboles dispersos y humedal amortiguador
  plantTrees(root, Array.from({ length: 10 }, () => ({ x: rnd(-11, 11), y: 0.05, z: (Math.random() < 0.5 ? 1 : -1) * rnd(6, 12), s: rnd(1.5, 2.4), ry: rnd(0, 6) })));

  const rain = makeRain(root, { n: 340, area: 15, yTop: 13 });

  agua.userData.tip = "Canal principal. El nivel decide la alerta de la cuenca";
  sirena.userData.tip = "Estacion de monitoreo. Sirena por nivel de alerta (verde a rojo)";
  sumids.forEach((s, i) => { s.userData.tip = "Sumidero " + (i + 1) + ": verde despejado, rojo tapado por basura"; });

  enableShadows(root);

  const cA = [C_OK, C_AVISO, C_ALERTA, C_CRITICO];
  const _tmp = new THREE.Color(), _flood = new THREE.Color(PAL.azulBogota), _floodBad = new THREE.Color("#5c4a33");

  return {
    cam: { radius: 22, phi: 0.92, theta: 0.78, target: [0, 1, 0], auto: 0.04, minR: 9, maxR: 48 },
    update(dt, t) {
      const d = rt.data || {};
      const nivel = d.nivel !== undefined ? d.nivel : 28;
      const lluvia = d.lluvia !== undefined ? d.lluvia : 2;
      const nAl = d.alerta !== undefined ? d.alerta : (d.nAl || 0);
      const sumid = d.sumid !== undefined ? d.sumid : 76;

      const clima = Math.min(lluvia / 40, 0.9);
      world.setHour(14, clima);

      // agua del canal sube y se ondula
      const hAgua = 0.06 + (nivel / 100) * 0.62;
      agua.position.y = hAgua;
      const arr = canalGeo.attributes.position.array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] = baseCY[i] + Math.sin(t * 2 + arr[i - 1] * 0.5) * 0.04;
      }
      canalGeo.attributes.position.needsUpdate = true;
      _tmp.set(nivel > 85 ? "#5c4a33" : nivel > 60 ? "#3f617a" : PAL.aguaProfunda);
      agua.material.color.lerp(_tmp, 0.05);

      // desborde en calles
      const floodK = Math.max(0, (nivel - 78) / 22);
      flood.material.opacity += (floodK * 0.55 - flood.material.opacity) * 0.05;
      flood.position.y = 0.12 + floodK * 0.25;
      flood.material.color.copy(_flood).lerp(_floodBad, floodK);

      // lluvia
      rain.step(dt, lluvia / 40);

      // sumideros: se tapan (rojo) cuando cae la capacidad
      sumids.forEach((s, i) => {
        const tapado = sumid < 88 - i * 8;
        s.material.color.lerp(tapado ? C_CRITICO : C_OK, 0.08);
        s.material.emissive.copy(s.material.color);
        s.position.y = tapado ? 0.19 : 0.14;
      });

      // sirena por nivel de alerta
      sirena.material.color.lerp(cA[nAl] || C_OK, 0.14);
      sirena.material.emissive.copy(sirena.material.color);
      sirena.material.emissiveIntensity = nAl >= 2 ? 0.7 + Math.abs(Math.sin(t * (nAl === 3 ? 9 : 5))) * 1.5 : 1.1;
      nivBar.forEach((seg, i) => { seg.material.emissiveIntensity = i <= nAl ? 1 : 0.15; });

      // barrio se tine progresivamente en alerta naranja/roja
      manzInst.forEach((grp) => {
        _tmp.copy(grp.baseColor).lerp(cA[nAl] || C_OK, nAl >= 2 ? 0.35 : 0);
        grp.im.material.color.lerp(_tmp, 0.04);
      });

      // flecha de evacuacion pulsante
      evac.visible = nAl >= 2;
      if (evac.visible) {
        evac.userData.mat.emissiveIntensity = 0.5 + Math.abs(Math.sin(t * 4)) * 1.2;
        evac.position.y = 2.4 + Math.sin(t * 2) * 0.15;
      }
    },
  };
}
