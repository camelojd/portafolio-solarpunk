import * as THREE from "three";
import { PAL, mat, umat, vmat, C_OK, C_AVISO, C_CRITICO } from "../palette.js";
import { makeWorld, makeTerrain, makeCerros, plantTrees, enableShadows, P, B, Cyl, Ico, ChB, mergePainted, scatter, makeFlecha, rnd } from "../core.js";

/* ================================================================
   REFUGIO VIVO DT: refugios modulares con materiales reciclados.
   Pieza de referencia de estilo del portafolio low poly solarpunk.
   El techo de cada refugio es el semaforo del confort termico.
   ================================================================ */

function vmatShared() { return vmat(); }

/* animal estilizado que deambula con bob vertical */
function makeAnimal(tipo) {
  const g = new THREE.Group();
  if (tipo === "gallina") {
    const cuerpo = Ico(0.11, mat(PAL.blanco));
    cuerpo.scale.set(1.15, 0.95, 0.85);
    P(g, cuerpo, 0, 0.14, 0);
    P(g, B(0.03, 0.05, 0.06, mat("#D94F3D")), 0, 0.28, 0.02);
    P(g, new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 4), mat(PAL.atardecer)), 0, 0.2, 0.13).rotation.x = Math.PI / 2;
  } else if (tipo === "cerdo") {
    const cuerpo = Ico(0.16, mat("#E8A79B"));
    cuerpo.scale.set(1.3, 0.9, 0.9);
    P(g, cuerpo, 0, 0.16, 0);
    P(g, new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.07, 3), mat("#E8A79B")), -0.09, 0.28, 0.1);
    P(g, new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.07, 3), mat("#E8A79B")), 0.09, 0.28, 0.1);
    P(g, B(0.04, 0.04, 0.03, mat("#C98779")), 0, 0.16, 0.21);
  } else {
    const cuerpo = Ico(0.14, mat(PAL.arena));
    cuerpo.scale.set(1.25, 1, 0.85);
    P(g, cuerpo, 0, 0.2, 0);
    P(g, Ico(0.08, mat(PAL.arena)), 0, 0.34, 0.12);
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.1, 4), mat(PAL.maderaOscura));
    c1.rotation.x = -0.6; P(g, c1, -0.04, 0.43, 0.1);
    const c2 = c1.clone(); c2.position.x = 0.04; g.add(c2);
    [[-0.07, 0.06], [0.07, 0.06], [-0.07, -0.06], [0.07, -0.06]].forEach(([x, z]) => {
      P(g, Cyl(0.02, 0.02, 0.12, mat(PAL.maderaOscura), 4), x, 0.06, z);
    });
  }
  g.traverse((o) => { o.userData.noShadow = true; });
  g.userData.wander = { tx: 0, tz: 0, t: 0, speed: tipo === "gallina" ? 0.5 : 0.32 };
  return g;
}

export function buildRefugio(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 16, sunR: 26 });
  makeTerrain(root, {
    size: 52, seg: 22, amp: 0.7, flatR: 10,
    camino: (x, z) => Math.abs(z - x * 0.25) < 1.1 && x > -12 && x < 14,
  });
  makeCerros(root, { z: -42, s: 0.9 });
  const trees = [];
  for (let i = 0; i < 16; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(12, 21);
    trees.push({ x: Math.cos(a) * r, y: 0.1, z: Math.sin(a) * r, s: rnd(1.6, 2.8), ry: rnd(0, 6) });
  }
  plantTrees(root, trees);

  const refs = [];

  /* Refugio 1: contenedor reciclado (terracota, lineas verticales por geometria) */
  {
    const g = new THREE.Group();
    P(g, ChB(3.2, 1.7, 2.2, mat(PAL.terracota), 0.09), 0, 0.85, 0);
    const ridges = [];
    for (let i = 0; i < 6; i++) ridges.push({ geo: new THREE.BoxGeometry(0.06, 1.5, 0.05), hex: "#C4604B", x: -1.25 + i * 0.5, y: 0.85, z: 1.12 });
    P(g, new THREE.Mesh(mergePainted(ridges), vmatShared()), 0, 0, 0);
    P(g, B(0.7, 1.1, 0.06, mat(PAL.maderaOscura)), 0.8, 0.55, 1.12);
    const techo = P(g, ChB(3.6, 0.16, 2.6, umat(PAL.guadua), 0.06), 0, 1.83, 0);
    const banda = P(g, B(3.3, 0.1, 2.3, umat(PAL.guadua)), 0, 1.72, 0);
    P(root, g, -4.6, 0, -0.6);
    refs.push({ g, techo, banda });
  }

  /* Refugio 2: vigas de madera con ensamble visible */
  {
    const g = new THREE.Group();
    const beams = [];
    [[-1.15, 0, -0.85], [1.15, 0, -0.85], [-1.15, 0, 0.85], [1.15, 0, 0.85]].forEach(([x, , z]) => {
      beams.push({ geo: new THREE.BoxGeometry(0.16, 1.6, 0.16), hex: PAL.maderaClara, x, y: 0.8, z });
    });
    beams.push({ geo: new THREE.BoxGeometry(2.6, 0.14, 0.16), hex: PAL.maderaOscura, y: 1.55, z: -0.85 });
    beams.push({ geo: new THREE.BoxGeometry(2.6, 0.14, 0.16), hex: PAL.maderaOscura, y: 1.55, z: 0.85 });
    beams.push({ geo: new THREE.BoxGeometry(2.3, 1.15, 1.6), hex: "#D9BC8A", y: 0.62 });
    P(g, new THREE.Mesh(mergePainted(beams), vmatShared()), 0, 0, 0);
    const techo = P(g, ChB(2.9, 0.14, 2.1, umat(PAL.guadua), 0.05), 0, 1.72, 0);
    const banda = P(g, B(2.62, 0.09, 1.85, umat(PAL.guadua)), 0, 1.62, 0);
    P(root, g, -0.4, 0, 1.4);
    refs.push({ g, techo, banda });
  }

  /* Refugio 3: guadua (cilindros de 6 lados con nudos) + base de llantas */
  {
    const g = new THREE.Group();
    // llantas apiladas: toroides de 8 segmentos, instanciadas
    const llantaGeo = new THREE.TorusGeometry(0.3, 0.1, 4, 8);
    llantaGeo.rotateX(Math.PI / 2);
    const piles = [];
    [[-1.05, 0.75], [1.05, 0.75], [-1.05, -0.75], [1.05, -0.75]].forEach(([x, z]) => {
      for (let i = 0; i < 2; i++) piles.push({ x, y: 0.1 + i * 0.2, z });
    });
    const im = scatter(g, llantaGeo, mat("#3B3F42"), piles);
    im.position.set(0, 0, 0);
    // muros de guadua con nudos marcados por anillos
    const canas = [];
    for (let i = 0; i < 9; i++) {
      const x = -1 + i * 0.25;
      canas.push({ geo: new THREE.CylinderGeometry(0.06, 0.07, 1.5, 6), hex: PAL.guadua, x, y: 1.15, z: -0.8 });
      canas.push({ geo: new THREE.CylinderGeometry(0.075, 0.075, 0.05, 6), hex: "#8A9838", x, y: 1.05, z: -0.8 });
      canas.push({ geo: new THREE.CylinderGeometry(0.075, 0.075, 0.05, 6), hex: "#8A9838", x, y: 1.55, z: -0.8 });
    }
    canas.push({ geo: new THREE.BoxGeometry(2.4, 1.3, 1.5), hex: "#DCE8C8", y: 1.05 });
    P(g, new THREE.Mesh(mergePainted(canas), vmatShared()), 0, 0, 0);
    // techo de tela con leve curvatura (semitransparente)
    const telaGeo = new THREE.PlaneGeometry(2.9, 2.1, 6, 4);
    const tp = telaGeo.attributes.position;
    for (let i = 0; i < tp.count; i++) tp.setZ(i, Math.sin((tp.getX(i) / 2.9 + 0.5) * Math.PI) * 0.22);
    telaGeo.rotateX(-Math.PI / 2);
    telaGeo.computeVertexNormals();
    const techo = new THREE.Mesh(telaGeo, umat(PAL.arena, { transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
    techo.userData.noShadow = true;
    P(g, techo, 0, 2.0, 0);
    const banda = P(g, B(2.5, 0.08, 1.7, umat(PAL.guadua)), 0, 1.86, 0);
    P(root, g, 4.4, 0, -0.9);
    refs.push({ g, techo, banda });
  }

  refs.forEach((r, i) => { r.g.userData.tip = "Refugio " + (i + 1) + ": el techo es el semaforo de confort termico"; });

  /* animales que deambulan */
  const animales = [];
  const tipos = ["gallina", "gallina", "gallina", "cerdo", "cerdo", "cabra", "cabra"];
  tipos.forEach((tipo) => {
    const a = makeAnimal(tipo);
    a.position.set(rnd(-6, 6), 0.05, rnd(3, 7));
    root.add(a);
    animales.push(a);
  });

  /* flechas de viento (conos planos cian) */
  const flechas = [];
  for (let i = 0; i < 3; i++) {
    const f = makeFlecha(PAL.aguaVerde);
    f.position.set(-8 + i * 3, 2.9 + i * 0.3, 3.5);
    root.add(f);
    flechas.push(f);
  }

  enableShadows(root);

  const cGuadua = new THREE.Color(PAL.guadua), cAcero = new THREE.Color(PAL.aceroClaro);
  return {
    cam: { radius: 13, phi: 1.05, theta: 0.65, target: [0, 1.1, 0], auto: 0.05, minR: 6, maxR: 28 },
    update(dt, t) {
      const d = rt.data || {};
      const R = d.refugios || [];
      world.setHour(d.hora !== undefined ? d.hora : 12);
      const guadua = (d.techo || "guadua") === "guadua";

      refs.forEach((ref, i) => {
        const r = R[i];
        // semaforo en el techo: verde en rango, amarillo cerca, rojo fuera
        let tgt = C_OK;
        if (r && !r.dentro) {
          const dist = Math.min(Math.abs(r.tint - r.tmin), Math.abs(r.tint - r.tmax));
          tgt = dist <= 3 ? C_AVISO : C_CRITICO;
        }
        ref.techo.material.color.lerp(tgt, 0.08);
        // la banda bajo el techo dice el material elegido (guadua o acero)
        ref.banda.material.color.lerp(guadua ? cGuadua : cAcero, 0.1);
      });

      animales.forEach((a, i) => {
        const w = a.userData.wander;
        w.t -= dt;
        if (w.t <= 0) { w.tx = rnd(-6.5, 6.5); w.tz = rnd(2.5, 7.5); w.t = rnd(3, 7); }
        const dx = w.tx - a.position.x, dz = w.tz - a.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.15) {
          a.position.x += (dx / dist) * w.speed * dt;
          a.position.z += (dz / dist) * w.speed * dt;
          a.rotation.y = THREE.MathUtils.lerp(a.rotation.y, Math.atan2(dx, dz), 0.06);
          a.position.y = 0.05 + Math.abs(Math.sin(t * 6 + i)) * 0.035;  // bob
        } else {
          a.position.y = 0.05;
        }
      });

      flechas.forEach((f, i) => {
        f.position.x += dt * 0.7;
        if (f.position.x > 9) f.position.x = -9;
        f.userData.mat.opacity = 1;
        f.position.y += Math.sin(t * 1.4 + i * 2) * 0.002;
      });
    },
  };
}
