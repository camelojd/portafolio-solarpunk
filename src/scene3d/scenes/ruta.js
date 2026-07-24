import * as THREE from "three";
import { M, B, S, Cn, P, makeSky, makeFireflies, makeTree, enableShadows } from "./_legacy.js";
import { rnd } from "../core.js";
import { clamp } from "../../lib/util.js";
import { RUTA } from "../../content/index.js";

export function buildRuta(scene, root, rt) {
  scene.fog = new THREE.Fog("#06231d", 30, 110);
  makeSky(root);
  const hemi = new THREE.HemisphereLight("#bfe8d4", "#0c1f16", 0.55);
  root.add(hemi);
  const sun = new THREE.DirectionalLight("#ffe3b0", 0.9);
  sun.position.set(14, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sd = 22;
  sun.shadow.camera.left = -sd; sun.shadow.camera.right = sd; sun.shadow.camera.top = sd; sun.shadow.camera.bottom = -sd;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 80; sun.shadow.bias = -0.0004;
  root.add(sun);
  const base = new THREE.Mesh(new THREE.CircleGeometry(26, 48), M("#0d2a1e", { roughness: 0.95 }));
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.6;
  base.userData.noShadow = true;
  root.add(base);
  const pts = RUTA.map((p, i) => {
    const a = -0.5 + i * 0.72;
    const r = 13.5 - i * 1.15;
    return new THREE.Vector3(Math.cos(a) * r, i * 1.55, Math.sin(a) * r);
  });
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 140, 0.09, 8, false), M("#558B2F", { emissive: "#558B2F", emissiveIntensity: 0.5, transparent: true, opacity: 0.6 }));
  tube.userData.noShadow = true;
  root.add(tube);
  const motes = [];
  for (let i = 0; i < 26; i++) {
    const m = S(0.09, "#C8E6A6", { emissive: "#C8E6A6", emissiveIntensity: 1.6 }, 8);
    m.userData = { s: i / 26 };
    m.userData.noShadow = true;
    root.add(m);
    motes.push(m);
  }
  const stations = RUTA.map((p, i) => {
    const g = new THREE.Group();
    g.position.copy(pts[i]);
    root.add(g);
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.28, 6), M("#2f4550"));
    P(g, hex, 0, 0, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.05, 6, 6), M("#7CB342", { emissive: "#7CB342", emissiveIntensity: 0.8 }));
    rim.rotation.x = -Math.PI / 2;
    rim.userData.noShadow = true;
    P(g, rim, 0, 0.16, 0);
    const ob = B(0.5, 1.9, 0.5, "#3c5561");
    P(g, ob, 0, 1.1, 0);
    const band = B(0.56, 0.3, 0.56, "#7CB342", { emissive: "#7CB342", emissiveIntensity: 1.2 });
    band.userData.noShadow = true;
    P(g, band, 0, 1.5, 0);
    const cap = Cn(0.42, 0.55, "#7CB342", { emissive: "#7CB342", emissiveIntensity: 1 });
    cap.userData.noShadow = true;
    P(g, cap, 0, 2.35, 0);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.03, 5, 22), M("#C8E6A6", { emissive: "#C8E6A6", emissiveIntensity: 1, transparent: true, opacity: 0.6 }));
    halo.rotation.x = -Math.PI / 2;
    halo.userData.noShadow = true;
    P(g, halo, 0, 2.9, 0);
    const stars = [];
    for (let d = 0; d < p.dif; d++) {
      const st = S(0.075, "#fdcb6e", { emissive: "#fdcb6e", emissiveIntensity: 1.4 }, 8);
      st.userData.noShadow = true;
      P(g, st, -((p.dif - 1) * 0.1) + d * 0.2, 3.25, 0);
      stars.push(st);
    }
    return { g, hex, rim, ob, band, cap, halo, stars };
  });
  const summit = new THREE.Group();
  const last = pts[pts.length - 1];
  summit.position.set(last.x * 0.35, last.y + 3.2, last.z * 0.35);
  root.add(summit);
  const beacon = Cn(0.55, 1.6, "#fdcb6e", { emissive: "#fdcb6e", emissiveIntensity: 1.2 });
  beacon.userData.noShadow = true;
  P(summit, beacon, 0, 0, 0);
  const glow = S(0.34, "#ffe9a8", { emissive: "#ffe9a8", emissiveIntensity: 2 }, 12);
  glow.userData.noShadow = true;
  P(summit, glow, 0, 1.1, 0);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const rg = new THREE.Mesh(new THREE.TorusGeometry(1 + i * 0.5, 0.025, 5, 26), M("#fdcb6e", { emissive: "#fdcb6e", emissiveIntensity: 0.9, transparent: true, opacity: 0.4 }));
    rg.rotation.x = -Math.PI / 2;
    rg.userData.noShadow = true;
    P(summit, rg, 0, -0.6 - i * 0.3, 0);
    rings.push(rg);
  }
  for (let i = 0; i < 12; i++) {
    const a = rnd(0, 6.28), r = rnd(15, 24);
    P(root, makeTree(rnd(0.9, 1.7)), Math.cos(a) * r, -0.5, Math.sin(a) * r);
  }
  const ffly = makeFireflies(root, 90, "#C8E6A6", 20, 12);
  enableShadows(root);
  const cDone = new THREE.Color("#22C55E"), cNow = new THREE.Color("#fdcb6e"), cNext = new THREE.Color("#3d5a67");
  return {
    cam: { radius: 30, phi: 1.02, theta: 0.6, target: [0, 5, 0], auto: 0.05, minR: 10, maxR: 60 },
    update(dt, t) {
      const sel = rt.sel !== undefined ? rt.sel : 0;
      const prog = rt.prog !== undefined ? rt.prog : 0;
      stations.forEach((s, i) => {
        const done = i < prog, now = i === prog, isSel = i === sel;
        const c = done ? cDone : now ? cNow : cNext;
        [s.rim, s.band, s.cap, s.halo].forEach((m) => {
          m.material.color.lerp(c, 0.06);
          m.material.emissive.copy(m.material.color);
        });
        const pulse = now ? 0.6 + Math.abs(Math.sin(t * 2.2)) * 0.9 : done ? 1 : 0.22;
        s.band.material.emissiveIntensity = pulse;
        s.cap.material.emissiveIntensity = pulse * 0.85;
        s.rim.material.emissiveIntensity = isSel ? 1.4 + Math.abs(Math.sin(t * 3)) * 0.8 : pulse * 0.7;
        s.halo.material.emissiveIntensity = isSel ? 1.5 : pulse * 0.5;
        s.halo.material.opacity = isSel ? 0.85 : 0.35;
        s.halo.rotation.z += dt * (isSel ? 1.1 : 0.25);
        s.halo.scale.setScalar(isSel ? 1.15 + Math.sin(t * 2.6) * 0.08 : 1);
        s.g.position.y = pts[i].y + (isSel ? Math.sin(t * 1.8) * 0.12 : 0);
        s.g.rotation.y += dt * (isSel ? 0.4 : 0.08);
        s.stars.forEach((st, d) => {
          st.material.emissiveIntensity = (done || now ? 1.4 : 0.3) + (isSel ? Math.abs(Math.sin(t * 4 + d)) * 0.8 : 0);
        });
      });
      const pk = clamp((prog + 0.5) / RUTA.length, 0.02, 1);
      tube.material.emissiveIntensity = 0.3 + Math.abs(Math.sin(t * 0.8)) * 0.2;
      motes.forEach((m) => {
        m.userData.s = (m.userData.s + dt * 0.045) % 1;
        const u = m.userData.s;
        m.position.copy(curve.getPointAt(u));
        const on = u < pk;
        m.material.color.lerp(on ? cDone : cNext, 0.08);
        m.material.emissive.copy(m.material.color);
        m.material.emissiveIntensity = on ? 1.4 : 0.25;
        m.scale.setScalar(on ? 1 : 0.55);
      });
      const done7 = prog >= RUTA.length;
      glow.material.emissiveIntensity = (done7 ? 2.4 : 0.7) + Math.abs(Math.sin(t * 1.6)) * (done7 ? 1.2 : 0.3);
      beacon.material.emissiveIntensity = done7 ? 1.4 : 0.35;
      summit.rotation.y += dt * 0.25;
      rings.forEach((rg, i) => {
        rg.rotation.z += dt * (0.3 + i * 0.15);
        rg.scale.setScalar(1 + Math.sin(t * 1.2 + i * 0.8) * 0.07);
        rg.material.opacity = (done7 ? 0.55 : 0.18) + Math.abs(Math.sin(t * 1.5 + i)) * 0.15;
      });
      ffly(dt, t);
    },
  };
}
