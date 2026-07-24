import * as THREE from "three";
import { PAL, mat, umat, semaforo, C_OK, C_CRITICO } from "../palette.js";
import { makeWorld, makePiso, enableShadows, P, B, Cyl, Ico, ChB, clamp01 } from "../core.js";

/* ================================================================
   FERMENTA VIVA DT: biorreactor de proteina lactea (ISA-88).
   El color del liquido interior es el semaforo de viabilidad.
   ================================================================ */
export function buildFermenta(scene, root, rt) {
  const world = makeWorld(scene, root, { shadowArea: 10, sunR: 22, noSunBall: true });
  world.setHour(11);
  makePiso(root, 22, 22, PAL.cemento);

  const TY = 1.85, TR = 1.3, TH = 3.0;

  // base y plataforma
  P(root, Cyl(TR + 0.35, TR + 0.5, 0.4, mat(PAL.aceroOscuro), 12), 0, 0.2, 0);
  // tanque: cilindro de 12 lados, acero claro, flat shading, tapas achaflanadas
  const casco = Cyl(TR, TR, TH, mat(PAL.aceroClaro, { transparent: true, opacity: 0.32 }), 12);
  casco.userData.noShadow = true;
  P(root, casco, 0, TY, 0);
  P(root, Cyl(TR + 0.05, TR, 0.22, mat(PAL.aceroOscuro), 12), 0, TY + TH / 2 + 0.05, 0);
  P(root, Cyl(TR, TR + 0.05, 0.22, mat(PAL.aceroOscuro), 12), 0, TY - TH / 2 - 0.05, 0);
  P(root, ChB(0.5, 0.4, 0.5, mat(PAL.asfalto)), 0, TY + TH / 2 + 0.35, 0);

  // liquido interior: color por viabilidad (semaforo continuo)
  const brothMat = umat(PAL.hoja, { transparent: true, opacity: 0.78 });
  const broth = new THREE.Mesh(new THREE.CylinderGeometry(TR - 0.08, TR - 0.08, TH - 0.2, 12), brothMat);
  broth.userData.noShadow = true;
  broth.position.set(0, TY - TH / 2 + 0.1, 0);
  broth.scale.y = 0.6;
  root.add(broth);

  // agitador: eje + 2 juegos de paletas planas
  const agit = new THREE.Group();
  agit.position.set(0, TY, 0);
  root.add(agit);
  P(agit, Cyl(0.06, 0.06, TH - 0.2, mat(PAL.aceroOscuro), 6), 0, 0, 0);
  [-0.7, 0.15].forEach((yy) => {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const blade = B(0.5, 0.12, 0.05, mat(PAL.aceroClaro));
      P(agit, blade, Math.cos(a) * 0.3, yy, Math.sin(a) * 0.3);
      blade.rotation.y = a;
    }
  });

  // burbujas: icosaedros de baja resolucion subiendo
  const bubbles = [];
  for (let i = 0; i < 14; i++) {
    const b = Ico(0.05 + Math.random() * 0.03, umat("#EAFFF2", { emissive: "#BFEECD", emissiveIntensity: 0.4, transparent: true, opacity: 0.7 }));
    b.userData.noShadow = true;
    const a = Math.random() * Math.PI * 2, r = Math.random() * (TR - 0.3);
    b.position.set(Math.cos(a) * r, TY - TH / 2 + Math.random() * (TH - 0.4), Math.sin(a) * r);
    root.add(b);
    bubbles.push(b);
  }

  // tuberias: verde nutrientes, azul aire, gris drenaje (cilindros de 6 lados)
  const feed = Cyl(0.08, 0.08, 2.2, mat(PAL.hoja), 6);
  feed.rotation.z = Math.PI / 2;
  P(root, feed, -1.9, TY + 0.5, 0.2);
  P(root, ChB(0.5, 0.7, 0.5, mat(PAL.musgo)), -3.0, 0.55, 0.2);
  const aire = Cyl(0.07, 0.07, 2.4, mat(PAL.azulBogota), 6);
  aire.rotation.z = Math.PI / 2;
  P(root, aire, 1.9, TY - 0.6, 0.4);
  const dren = Cyl(0.09, 0.09, 1.2, mat(PAL.aceroOscuro), 6);
  P(root, dren, 0, 0.55, 1.4);

  // sensores: icosaedros de color por tipo (rojo temp, azul DO, verde pH, amarillo VCD)
  const sensCols = [PAL.terracota, PAL.azulBogota, PAL.hoja, PAL.maderaClara];
  sensCols.forEach((c, i) => {
    const s = Ico(0.1, umat(c, { emissive: c, emissiveIntensity: 0.5 }), 1);
    s.userData.noShadow = true;
    P(root, s, TR + 0.15, TY - 0.7 + i * 0.5, 0);
  });

  // torre andon
  P(root, Cyl(0.05, 0.05, 2.0, mat(PAL.aceroOscuro), 6), 2.6, 1.0, -1.4);
  const andon = Ico(0.16, umat(PAL.hoja, { emissive: PAL.hoja, emissiveIntensity: 1.2 }), 1);
  andon.userData.noShadow = true;
  P(root, andon, 2.6, 2.1, -1.4);

  casco.userData.tip = "Biorreactor fed-batch. El color del caldo es la viabilidad del lote";
  andon.userData.tip = "Andon de fase ISA-88: verde produccion, amarillo crecimiento, rojo contaminado";
  agit.userData.tip = "Agitador Rushton. Gira mas rapido con mas biomasa";

  enableShadows(root);

  const cCIP = new THREE.Color(PAL.azulBogota);
  const _tmp = new THREE.Color();

  return {
    cam: { radius: 8.5, phi: 0.95, theta: 0.7, target: [0, 1.7, 0], auto: 0.04, minR: 5, maxR: 24 },
    update(dt, t) {
      const d = rt.data || {};
      const fase = d.fase || "Crecimiento";
      const od = d.od !== undefined ? d.od : 2;
      const titulo = d.titulo !== undefined ? d.titulo : 1;
      const contam = !!d.contam;
      const cip = fase.indexOf("CIP") === 0;

      agit.rotation.y += dt * (0.8 + od * 0.3);

      // nivel del caldo animado con el proceso
      const lvlTgt = cip ? 0.12 : clamp01(0.35 + od / 9);
      broth.scale.y += (lvlTgt - broth.scale.y) * Math.min(dt * 1.5, 1);
      broth.position.y = TY - TH / 2 + 0.1 + ((TH - 0.2) * broth.scale.y) / 2;

      // color del liquido = viabilidad. contaminado -> rojo; CIP -> azul; sano -> semaforo por titulo
      if (contam) _tmp.copy(C_CRITICO);
      else if (cip) _tmp.copy(cCIP);
      else semaforo(1 - clamp01(0.3 + titulo / 12), _tmp);
      broth.material.color.lerp(_tmp, 0.06);
      broth.material.opacity = cip ? 0.4 : 0.78;

      const rise = 0.3 + od * 0.12;
      bubbles.forEach((b, i) => {
        b.position.y += (cip ? 0.1 : rise) * dt;
        const topY = TY - TH / 2 + 0.1 + (TH - 0.2) * broth.scale.y;
        if (b.position.y > topY) b.position.y = TY - TH / 2 + 0.05;
        b.material.opacity = cip ? 0.15 : 0.5 + Math.abs(Math.sin(t * 3 + i)) * 0.3;
      });

      const tgt = contam ? C_CRITICO : cip ? cCIP : fase.indexOf("Producci") === 0 ? C_OK : new THREE.Color(PAL.maderaClara);
      andon.material.color.lerp(tgt, 0.1);
      andon.material.emissive.copy(andon.material.color);
      andon.material.emissiveIntensity = contam ? 0.6 + Math.abs(Math.sin(t * 8)) * 1.4 : 1.2;
    },
  };
}
