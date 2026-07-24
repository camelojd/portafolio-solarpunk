import * as THREE from "three";
import { M, B, C, S, P, makeSky, makeLights, makeFireflies, makeTree, enableShadows } from "./_legacy.js";

export function buildHub(scene, root) {
  scene.fog = new THREE.Fog("#06231d", 22, 95);
  const sky = makeSky(root);
  sky.uniforms.top.value.set("#1e5a40");
  sky.uniforms.bot.value.set("#051d16");
  makeLights(root, { int: 1.15 });
  const sunBall = S(1.6, "#fdcb6e", { emissive: "#fdcb6e", emissiveIntensity: 1.4 });
  sunBall.userData.noShadow = true;
  P(root, sunBall, 24, 15, -30);
  const islands = [];
  let rotor = null;
  function island(r, x, y, z, deco) {
    const g = new THREE.Group();
    P(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.75, 0.7, 6), M("#2d5016")), 0, 0, 0);
    P(g, new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 0.98, 0.1, 6), M("#3f7d3a")), 0, 0.4, 0);
    deco(g, r);
    g.position.set(x, y, z);
    g.userData.baseY = y;
    g.userData.ph = Math.random() * Math.PI * 2;
    root.add(g);
    islands.push(g);
  }
  island(4, 0, 2.2, 0, (g) => {
    P(g, makeTree(1.2), -1.8, 0.45, -1.2);
    P(g, makeTree(0.9), 1.5, 0.45, -2);
    P(g, makeTree(1), 2.2, 0.45, 1.4);
    for (let i = 0; i < 3; i++) {
      const p = B(1, 0.05, 0.7, "#0b3d63", { emissive: "#4F7CAC", emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.3 });
      p.rotation.x = -0.5;
      P(g, p, -0.6 + i * 1.1, 0.75, 1.9);
      P(g, C(0.03, 0.03, 0.45, "#8a9ba8"), -0.6 + i * 1.1, 0.55, 1.9);
    }
    P(g, C(0.05, 0.08, 2.4, "#dfe6e9"), -2.6, 1.6, 1.6);
    rotor = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const bl = B(0.06, 0.9, 0.02, "#f5f5f5");
      bl.position.y = 0.45;
      const bg = new THREE.Group();
      bg.add(bl);
      bg.rotation.z = i * ((Math.PI * 2) / 3);
      rotor.add(bg);
    }
    P(g, rotor, -2.6, 2.85, 1.72);
    P(g, S(0.09, "#f5f5f5"), -2.6, 2.85, 1.72);
  });
  const decoTree = (g) => { P(g, makeTree(0.8), 0, 0.45, 0); };
  const decoPanel = (g) => {
    const p = B(0.8, 0.05, 0.55, "#0b3d63", { emissive: "#4F7CAC", emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.3 });
    p.rotation.x = -0.5;
    P(g, p, 0, 0.62, 0);
  };
  island(1.5, -8, 3.4, -4, decoTree);
  island(1.2, 7.5, 4.5, -6, decoPanel);
  island(1.8, 8, 1.6, 5, decoTree);
  island(1.3, -7, 1.2, 6, decoPanel);
  island(1, -3, 5.6, -9, decoTree);
  const ffly = makeFireflies(root, 110, "#C8E6A6", 16, 10);
  enableShadows(root);
  return {
    cam: { radius: 15, phi: 1.12, theta: 0.6, target: [0, 2.6, 0], auto: 0.09, minR: 8, maxR: 32 },
    update(dt, t) {
      islands.forEach((g, i) => {
        g.position.y = g.userData.baseY + Math.sin(t * 0.5 + g.userData.ph) * 0.25;
        g.rotation.y += dt * 0.015 * (i % 2 ? 1 : -1);
      });
      if (rotor) rotor.rotation.z += dt * 2.2;
      ffly(dt, t);
    },
  };
}
