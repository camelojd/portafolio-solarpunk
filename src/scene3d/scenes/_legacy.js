import * as THREE from "three";
import { rnd } from "../core.js";

/* Helpers 3D heredados, usados solo por las escenas hub y ruta. */
export function M(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.08, ...o }); }
export function B(w, h, d, c, o) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); }
export function C(rt, rb, h, c, o, seg = 20) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(c, o)); }
export function S(r, c, o, seg = 18) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, Math.floor(seg / 1.5))), M(c, o)); }
export function Cn(r, h, c, o, seg = 16) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), M(c, o)); }
export function P(parent, mesh, x = 0, y = 0, z = 0) { mesh.position.set(x, y, z); parent.add(mesh); return mesh; }

export function makeSky(root) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#1b4d3a") }, bot: { value: new THREE.Color("#06231d") } },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec3 vP; uniform vec3 top; uniform vec3 bot; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(bot, top, pow(h, 0.85)), 1.0); }",
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(160, 20, 14), mat);
  m.userData.noShadow = true;
  root.add(m);
  return mat;
}

export function makeLights(root, opts = {}) {
  const hemi = new THREE.HemisphereLight(opts.sky || "#bfe8d4", opts.ground || "#0c1f16", opts.hemiInt !== undefined ? opts.hemiInt : 0.65);
  root.add(hemi);
  const sun = new THREE.DirectionalLight(opts.color || "#ffe3b0", opts.int !== undefined ? opts.int : 1.1);
  sun.position.set(10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const d = 16;
  sun.shadow.camera.left = -d; sun.shadow.camera.right = d; sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 60; sun.shadow.bias = -0.0004;
  root.add(sun);
  return { hemi, sun };
}

export function makeGround(root, r = 26, c = "#12301f") {
  const g = new THREE.Mesh(new THREE.CircleGeometry(r, 48), M(c, { roughness: 1 }));
  g.rotation.x = -Math.PI / 2;
  g.userData.noShadow = true;
  root.add(g);
  return g;
}

export function makeFireflies(root, n = 90, color = "#C8E6A6", spread = 18, yMax = 9) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-spread, spread); pos[i * 3 + 1] = rnd(0.5, yMax); pos[i * 3 + 2] = rnd(-spread, spread); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.14, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat);
  root.add(pts);
  return (dt, t) => { pts.rotation.y += dt * 0.02; mat.size = 0.12 + 0.05 * Math.sin(t * 1.7); };
}

export function makeTree(sc = 1) {
  const g = new THREE.Group();
  P(g, C(0.05 * sc, 0.08 * sc, 0.5 * sc, "#6b4a2b"), 0, 0.25 * sc, 0);
  P(g, S(0.3 * sc, "#22C55E"), 0, 0.62 * sc, 0);
  P(g, S(0.2 * sc, "#27ae60"), 0.14 * sc, 0.82 * sc, 0.05 * sc);
  return g;
}

export function enableShadows(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.receiveShadow = true;
      o.castShadow = !o.userData.noShadow && !(o.material && o.material.transparent);
    }
  });
}
