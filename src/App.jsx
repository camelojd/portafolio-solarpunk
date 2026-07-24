// 🔧 IMPORTANTE PARA MÓVIL:
// En el HTML principal, agregar esta línea dentro de <head>:
// <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
// Esto es crítico para que el portafolio se vea correctamente en móvil.

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { SCENE_BUILDERS } from "./scene3d/index.js";
import { disposeGroup } from "./scene3d/core.js";
import { clamp, fmt } from "./lib/util.js";
import "./styles/app.css";

/* ================================================================
   PORTAFOLIO 3D SOLARPUNK · GEMELOS DIGITALES EN VIVO
   ----------------------------------------------------------------
   Este archivo es solo componentes React y orquestacion. El resto vive en:
   - src/content/   PROFILE, DOMAINS, RUTA, STATUS (edita aqui el contenido)
   - src/sim/       los 8 simuladores activos (funcion sim*, init* y UMBRALES) + tests
   - src/scene3d/   la paleta, el nucleo 3D y las 10 escenas (8 gemelos + hub + ruta)
   - src/styles/    app.css
   - src/lib/       util.js (clamp, fmt, hhmm, mmss) y rng.js (semilla para tests)
   ================================================================ */

import { PROFILE, STATUS, RUTA, RUTA_ACTUAL, DOMAINS, DOMAIN_ORDER } from "./content/index.js";
import { SIMS, initSim } from "./sim/index.js";


function Scene({ sceneId, rt }) {
  const hostRef = useRef(null);
  const ctxRef = useRef(null);
  const updRef = useRef(null);
  const camRef = useRef({ theta: 0.7, phi: 1.05, radius: 12, target: new THREE.Vector3(0, 1, 0), auto: 0.07, minR: 5, maxR: 30, drag: false });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, host.clientWidth / host.clientHeight, 0.1, 400);
    const root = new THREE.Group();
    scene.add(root);
    ctxRef.current = { renderer, scene, camera, root };
    const cam = camRef.current;
    let px = 0, py = 0;
    const el = renderer.domElement;
    
    // Manejo multitáctil para pinch-zoom en móvil
    let touchDist = 0;
    const getTouchDistance = (t1, t2) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    const down = (e) => {
      cam.drag = true;
      if (e.touches && e.touches.length === 2) {
        touchDist = getTouchDistance(e.touches[0], e.touches[1]);
      } else {
        const touch = e.touches ? e.touches[0] : e;
        px = touch.clientX;
        py = touch.clientY;
      }
    };
    
    const move = (e) => {
      if (!cam.drag) return;
      if (e.touches && e.touches.length === 2) {
        // Pinch para zoom
        const newDist = getTouchDistance(e.touches[0], e.touches[1]);
        if (touchDist > 0) {
          cam.radius = clamp(cam.radius + (touchDist - newDist) * 0.015, cam.minR, cam.maxR);
        }
        touchDist = newDist;
      } else {
        // Drag normal
        const touch = e.touches ? e.touches[0] : e;
        const isMobile = window.innerWidth < 768;
        const sens = isMobile ? 0.007 : 0.005;  // Mayor sensibilidad en móvil
        cam.theta -= (touch.clientX - px) * sens;
        cam.phi = clamp(cam.phi - (touch.clientY - py) * 0.005, 0.18, 1.5);
        px = touch.clientX;
        py = touch.clientY;
      }
    };
    
    const up = () => {
      cam.drag = false;
      touchDist = 0;
    };
    
    const wheel = (e) => {
      e.preventDefault();
      cam.radius = clamp(cam.radius + e.deltaY * 0.01, cam.minR, cam.maxR);
    };
    
    el.addEventListener("pointerdown", down, { passive: true });
    el.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("touchend", up, { passive: true });
    el.addEventListener("wheel", wheel, { passive: false });

    // Tooltip HTML por raycaster: al pasar sobre un objeto con userData.tip
    // se muestra su descripcion y el objeto crece un poco (feedback).
    const tipEl = document.createElement("div");
    tipEl.className = "sp-tip";
    host.appendChild(tipEl);
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hovered = null;
    const findTip = (o) => { let n = o; while (n && n !== root) { if (n.userData && n.userData.tip) return n; n = n.parent; } return null; };
    const setHover = (obj) => {
      if (hovered === obj) return;
      if (hovered) hovered.scale.copy(hovered.userData._baseScale || new THREE.Vector3(1, 1, 1));
      hovered = obj;
      if (hovered) {
        if (!hovered.userData._baseScale) hovered.userData._baseScale = hovered.scale.clone();
        hovered.scale.copy(hovered.userData._baseScale).multiplyScalar(1.06);
      }
    };
    const hover = (e) => {
      if (cam.drag) { tipEl.style.opacity = "0"; setHover(null); return; }
      const rect = el.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(root.children, true);
      let tipObj = null;
      for (const h of hits) { tipObj = findTip(h.object); if (tipObj) break; }
      setHover(tipObj);
      if (tipObj) {
        tipEl.textContent = tipObj.userData.tip;
        tipEl.style.left = (e.clientX - rect.left) + "px";
        tipEl.style.top = (e.clientY - rect.top) + "px";
        tipEl.style.opacity = "1";
        el.style.cursor = "pointer";
      } else {
        tipEl.style.opacity = "0";
        el.style.cursor = "";
      }
    };
    el.addEventListener("pointermove", hover, { passive: true });
    el.addEventListener("pointerleave", () => { tipEl.style.opacity = "0"; setHover(null); }, { passive: true });
    
    const onResize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    // Botones de camara: reset / vista superior / isometrica
    const camCmd = (e) => {
      const h = cam.home || {};
      if (e.detail === "reset") { cam.theta = h.theta ?? 0.7; cam.phi = h.phi ?? 1.05; cam.radius = h.radius ?? 12; }
      else if (e.detail === "top") { cam.phi = 0.2; cam.radius = (h.radius ?? 12) * 1.1; }
      else if (e.detail === "iso") { cam.theta = 0.78; cam.phi = 0.95; cam.radius = h.radius ?? 12; }
    };
    window.addEventListener("sp-cam", camCmd);

    // Pausa el render loop cuando el canvas no esta visible (ahorro de bateria)
    let visible = true;
    const io = new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; }, { threshold: 0.01 });
    io.observe(host);

    const clock = new THREE.Clock();
    let raf = 0, tt = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible) return;
      tt += dt;
      if (!cam.drag) cam.theta += cam.auto * dt;
      const sp = Math.sin(cam.phi), r = cam.radius;
      camera.position.set(
        cam.target.x + r * sp * Math.sin(cam.theta),
        cam.target.y + r * Math.cos(cam.phi),
        cam.target.z + r * sp * Math.cos(cam.theta)
      );
      camera.lookAt(cam.target);
      if (updRef.current) updRef.current(dt, tt);
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("sp-cam", camCmd);
      el.removeEventListener("pointermove", hover);
      io.disconnect();
      if (tipEl.parentNode) tipEl.parentNode.removeChild(tipEl);
      disposeGroup(root);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    updRef.current = null;
    disposeGroup(ctx.root);
    const build = SCENE_BUILDERS[sceneId] || SCENE_BUILDERS.hub;
    const built = build(ctx.scene, ctx.root, rt);
    const c = camRef.current;
    c.theta = built.cam.theta;
    c.phi = built.cam.phi;
    c.radius = built.cam.radius;
    c.target.set(built.cam.target[0], built.cam.target[1], built.cam.target[2]);
    c.auto = built.cam.auto;
    c.minR = built.cam.minR;
    c.maxR = built.cam.maxR;
    c.home = { theta: built.cam.theta, phi: built.cam.phi, radius: built.cam.radius };
    updRef.current = built.update;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  return <div ref={hostRef} className="sp-canvas" />;
}

function Spark({ vals, color = "#558B2F", w = 110, h = 30 }) {
  if (!vals || vals.length < 2) return <svg width={w} height={h} className="spark" />;
  const min = Math.min(...vals), max = Math.max(...vals), r = max - min || 1;
  const pts = vals
    .map((v, i) => (((i / (vals.length - 1)) * w).toFixed(1) + "," + (h - 2 - ((v - min) / r) * (h - 4)).toFixed(1)))
    .join(" ");
  return (
    <svg width={w} height={h} className="spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

/* ================= APP PRINCIPAL ================= */
export default function SolarpunkPortfolio() {
  const [view, setView] = useState("hub");
  const [domainId, setDomainId] = useState("solarpunk");
  const [pIdx, setPIdx] = useState(0);
  const [rIdx, setRIdx] = useState(RUTA_ACTUAL);
  const [sheet, setSheet] = useState(false);
  const [data, setData] = useState({});
  const [log, setLog] = useState([]);
  const [speed, setSpeed] = useState(1);
  const [toggleOn, setToggleOn] = useState(false); // estado de los toggles persistentes (ej. fuente de irradiancia)
  const [feed, setFeed] = useState({ conn: "disabled", live: false, lastTs: 0 }); // ingesta MQTT: SIMULADO vs DATO REAL
  const realRef = useRef(null);            // ultima lectura de sensores {temp,hum,irr,ts}
  const feedCfgRef = useRef({ timeoutMs: 15000 });
  const rtRef = useRef({ data: {}, queue: [], cmds: {} });
  const rt = rtRef.current;
  const simRef = useRef(null);
  const histRef = useRef({});
  const speedRef = useRef(1);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  const camCmd = (m) => window.dispatchEvent(new CustomEvent("sp-cam", { detail: m }));

  const domain = DOMAINS[domainId];
  const projects = domain ? domain.projects : [];
  const project = (view === "carousel" || view === "detail") && projects.length ? projects[Math.min(pIdx, projects.length - 1)] : null;
  const sceneId = view === "ruta" ? "ruta" : project ? project.id : "hub";
  const rStep = RUTA[Math.min(rIdx, RUTA.length - 1)];
  rt.sel = rIdx;
  rt.prog = RUTA_ACTUAL;

  useEffect(() => {
    rt.queue.length = 0;
    rt.cmds = {};
    histRef.current = {};
    setLog([]);
    setToggleOn(false);
    if (!project) {
      simRef.current = null;
      rt.data = {};
      setData({});
      return;
    }
    simRef.current = initSim(project.id);
    rt.data = simRef.current;
    const vars = project.vars || [];
    const id = setInterval(() => {
      const sim = SIMS[project.id];
      if (!sim || !simRef.current) return;
      // Ingesta real: si el ultimo mensaje del nodo es reciente, simSol lo consume;
      // si expira el timeout, fresh=false y el modelo vuelve a la serie sintetica.
      const r = realRef.current;
      const fresh = !!(r && Date.now() - r.ts < feedCfgRef.current.timeoutMs);
      rt.real = r ? { temp: r.temp, hum: r.hum, irr: r.irr, fresh } : null;
      if (r) setFeed((f) => (f.live === fresh && f.lastTs === r.ts ? f : { ...f, live: fresh, lastTs: r.ts }));
      // El slider de velocidad corre 1/2/4/8 sub-pasos de simulacion por tick
      const steps = Math.max(1, speedRef.current | 0);
      let s = simRef.current;
      const evs = [];
      for (let k = 0; k < steps; k++) {
        s = sim(s, 0.5, rt);
        if (s._ev && s._ev.length) evs.push(...s._ev.map((m) => ({ t: s.clock, m })));
      }
      simRef.current = s;
      rt.data = s;
      if (evs.length) setLog((l) => [...evs.reverse(), ...l].slice(0, 9));
      vars.forEach((v) => {
        const val = s[v.key];
        if (typeof val === "number") {
          const hArr = histRef.current[v.key] || (histRef.current[v.key] = []);
          hArr.push(val);
          if (hArr.length > 44) hArr.shift();
        }
      });
      setData({ ...s });
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  // Ingesta MQTT de sensores reales: solo para gemelos con project.mqtt. Fallback
  // silencioso: sin broker configurado (o ante fallo) la app sigue en modo simulado.
  useEffect(() => {
    realRef.current = null;
    setFeed({ conn: "disabled", live: false, lastTs: 0 });
    if (!project || !project.mqtt) return;
    // Carga diferida: mqtt.js solo se descarga al abrir un gemelo con ingesta.
    let stop = () => {};
    let cancelled = false;
    import("./lib/mqttClient.js").then(({ startMqtt, readMqttConfig }) => {
      if (cancelled) return;
      feedCfgRef.current = readMqttConfig();
      stop = startMqtt(
        (reading) => { realRef.current = reading; },
        (st) => setFeed((f) => ({ ...f, conn: st.state })),
      );
    });
    return () => { cancelled = true; stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const next = () => setPIdx((i) => (projects.length ? (i + 1) % projects.length : 0));
  const prev = () => setPIdx((i) => (projects.length ? (i - 1 + projects.length) % projects.length : 0));

  useEffect(() => {
    const h = (ev) => {
      if (view === "carousel") {
        if (ev.key === "ArrowRight") next();
        if (ev.key === "ArrowLeft") prev();
        if (ev.key === "Escape") setView("hub");
      } else if (view === "ruta") {
        if (ev.key === "ArrowRight") setRIdx((i) => (i + 1) % RUTA.length);
        if (ev.key === "ArrowLeft") setRIdx((i) => (i - 1 + RUTA.length) % RUTA.length);
        if (ev.key === "Escape") setView("hub");
      } else if (view === "detail" && ev.key === "Escape") {
        setView("carousel");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const openDomain = (id) => { setDomainId(id); setPIdx(0); setView("carousel"); };
  useEffect(() => { setSheet(false); }, [view, sceneId, rIdx]);
  const st = project ? STATUS[project.status] : null;
  const kpiVal = project && typeof data[project.kpi.key] === "number" ? data[project.kpi.key] : null;

  return (
    <div className="sp-root">
      <Scene sceneId={sceneId} rt={rt} />
      <div className="hexbg" />
      <div key={sceneId + view} className="scenefade" />
      <div className="ui">
        {view === "hub" && (
          <div className="hub">
            <div className="hub-badge">🌱 PORTAFOLIO · GEMELOS DIGITALES EN VIVO</div>
            <h1 className="hub-name">{PROFILE.name}</h1>
            <div className="hub-role">{PROFILE.role}</div>
            <div className="hub-sub">{PROFILE.sub} · {PROFILE.location}</div>
            <div className="domains">
              {DOMAIN_ORDER.map((id) => {
                const d = DOMAINS[id];
                const n = d.projects.length;
                return (
                  <button key={id} className="dcard int" onClick={() => openDomain(id)}>
                    <div className="dcard-icon">{d.icon}</div>
                    <div className="dcard-name">{d.name}</div>
                    <div className="dcard-count">{n ? n + (n > 1 ? " gemelos digitales" : " gemelo digital") : "en expansión"}</div>
                    <div className="dcard-desc">{d.desc}</div>
                    <div className="dcard-go">Explorar →</div>
                  </button>
                );
              })}
            </div>
            <div className="hub-note">
              Los 8 gemelos que ves aquí son <b>simulaciones</b>: demuestran qué decide un gemelo digital sin necesitar la planta instalada. En cada uno te cuento en qué punto de mi ruta va y qué le falta para volverse real.
            </div>
            <button className="rutabtn int" onClick={() => setView("ruta")}>
              🧭 Mi ruta: de estudiante a Ingeniero Multimedia especializado en Gemelos Digitales · 7 proyectos →
            </button>
            <div className="hub-links">
              <a className="linkbtn int" href={PROFILE.github} target="_blank" rel="noreferrer">GitHub</a>
              <a className="linkbtn int" href={PROFILE.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a className="linkbtn int" href={"mailto:" + PROFILE.email}>Contacto</a>
            </div>
            <div className="hint">arrastra para rotar la escena · rueda para acercar</div>
          </div>
        )}

        {view === "ruta" && (
          <>
            <div className="topbar">
              <button className="iconbtn int" onClick={() => setView("hub")}>← Inicio</button>
              <div className="tb-title glass">🧭 RUTA 2026 → 2031</div>
              <div className="rprog glass">{RUTA_ACTUAL} / {RUTA.length} completados</div>
            </div>

            <div className={"rpanel glass" + (sheet ? " up" : "")} key={rStep.n}>
              <button className="grab int" onClick={() => setSheet((v) => !v)} aria-expanded={sheet} aria-label={sheet ? "Contraer panel" : "Expandir panel"}>
                <span className="grab-b" />
                <span className="grab-t">{sheet ? "▾ contraer · ver escena" : "▴ expandir · leer todo"}</span>
              </button>
              <div className="rpanel-body int">
              <div className="rhead">
                <div className="remoji">{rStep.emoji}</div>
                <div className="rtitle">
                  <div className="rnum">PROYECTO {rStep.n} · {rStep.tiempo}</div>
                  <div className="rname">{rStep.name}</div>
                  <div className="rtag">{rStep.tag}</div>
                </div>
              </div>
              <div className="rmeta">
                <span className={"rpill " + (rIdx < RUTA_ACTUAL ? "st-done" : rIdx === RUTA_ACTUAL ? "st-dev" : "st-soon")}>
                  {rIdx < RUTA_ACTUAL ? "✔ Completado" : rIdx === RUTA_ACTUAL ? "▶ En curso" : "○ Pendiente"}
                </span>
                <span className="rstars">{"★".repeat(rStep.dif)}<span className="rdim">{"★".repeat(5 - rStep.dif)}</span></span>
                <span className="rchip cost">{rStep.inversion}</span>
              </div>

              <div className="sec-t">Qué construyo</div>
              <p className="ptext">{rStep.construyo}</p>

              <div className="sec-t">Por qué elegí este proyecto</div>
              <p className="ptext">{rStep.porque}</p>

              <div className="sec-t">Qué demuestra</div>
              <p className="rdemo">{rStep.demuestra}</p>

              <div className="sec-t">Qué vuelve real del portafolio</div>
              <p className="rdesb"><span className="rdesb-i">◈</span>{rStep.desbloquea}</p>

              <div className="sec-t">Decisión técnica</div>
              <p className="rnota">{rStep.decision}</p>

              <div className="sec-t">Stack</div>
              <div className="stack">
                {rStep.stack.map((x) => <span key={x} className="chip">{x}</span>)}
              </div>

              <div className="sec-t">Entregable verificable</div>
              <p className="ptext">{rStep.entregable}</p>
              </div>
            </div>

            <div className="rsteps int">
              {RUTA.map((p, i) => (
                <button
                  key={p.n}
                  className={"rstep" + (i === rIdx ? " on" : "") + (i < RUTA_ACTUAL ? " done" : i === RUTA_ACTUAL ? " now" : "")}
                  onClick={() => setRIdx(i)}
                  aria-label={"Proyecto " + p.n + ": " + p.name}
                >
                  <span className="rstep-e">{p.emoji}</span>
                  <span className="rstep-n">{p.n}</span>
                </button>
              ))}
            </div>
            <div className="watermark">◈ mi ruta: estudiante → especialista en gemelos digitales · datos técnicos verificados a julio de 2026</div>
          </>
        )}

        {view === "carousel" && (
          <>
            <div className="topbar">
              <button className="iconbtn int" onClick={() => setView("hub")}>← Inicio</button>
              <div className="tb-title glass">{domain.icon} {domain.name}</div>
              <div className="dots">
                {projects.map((p, i) => (
                  <button key={p.id} aria-label={p.name} className={"dot int" + (i === pIdx ? " on" : "")} onClick={() => setPIdx(i)} />
                ))}
              </div>
            </div>
            {projects.length > 1 && (
              <>
                <button className="arrow left int" onClick={prev} aria-label="Proyecto anterior">‹</button>
                <button className="arrow right int" onClick={next} aria-label="Proyecto siguiente">›</button>
              </>
            )}
            {project ? (
              <div className={"pcard glass" + (sheet ? " up" : "")} key={project.id}>
                <button className="grab int" onClick={() => setSheet((v) => !v)} aria-expanded={sheet} aria-label={sheet ? "Contraer panel" : "Expandir panel"}>
                <span className="grab-b" />
                <span className="grab-t">{sheet ? "▾ contraer · ver escena" : "▴ expandir · leer todo"}</span>
              </button>
                <div className="pcard-body int">
                <div className="counter">{pIdx + 1} / {projects.length}</div>
                <div className="pcard-head">
                  <div className="pcard-emoji">{project.emoji}</div>
                  <div className="pcard-title">
                    <div className="pcard-name">{project.name}</div>
                    <div className="pcard-tag">{project.tag}</div>
                  </div>
                  <div className={"pill " + st.cls}>{st.label}</div>
                </div>
                <div className="pcard-short">{project.short}</div>
                <div className="nivelbar">
                  <span className="nivelbar-p">{project.nivel.p}</span>
                  <span className="nivelbar-t">para volverlo real · {project.nivel.txt.split(".")[0]}.</span>
                </div>
                <div className="chips">
                  <span className="live"><span className="livedot" />LIVE</span>
                  {project.chips.map((k) => {
                    const v = project.vars.find((x) => x.key === k);
                    const val = data[k];
                    return (
                      <span key={k} className="chip">
                        {v.label}: <b>{typeof val === "number" ? fmt(val, v.dec) : typeof val === "string" ? val : "s/d"}</b> {v.unit}
                      </span>
                    );
                  })}
                </div>
                <div className="pcard-btns">
                  <button className="btn int" onClick={() => setView("detail")}>Ver gemelo completo →</button>
                  {project.repo ? (
                    <a className="btn ghost int" href={project.repo} target="_blank" rel="noreferrer">Repo</a>
                  ) : (
                    <span className="btn ghost off">Repo · pronto</span>
                  )}
                  {project.video ? (
                    <a className="btn ghost int" href={project.video} target="_blank" rel="noreferrer">Video</a>
                  ) : (
                    <span className="btn ghost off">Video · pronto</span>
                  )}
                </div>
                </div>
              </div>
            ) : (
              <div className="pcard glass int empty">
                <div className="pcard-emoji">🚧</div>
                <div className="pcard-name">Dominio en expansión</div>
                <div className="pcard-short">Los próximos gemelos digitales (Smart Cities, Salud, Redes de energía) se agregan aquí editando solo el objeto DOMAINS del código, sin recodificar nada más.</div>
                <button className="btn int" onClick={() => setView("hub")}>← Volver al inicio</button>
              </div>
            )}
            <div className="watermark">◈ simulación · datos generados, no medidos · la lógica y los umbrales son reales</div>
          </>
        )}

        {view === "detail" && project && (
          <>
            <div className="topbar">
              <button className="iconbtn int" onClick={() => setView("carousel")}>← {domain.name}</button>
              <div className="tb-title glass">{project.emoji} {project.name}</div>
              <div className={"pill " + st.cls}>{st.label}</div>
            </div>
            <div className="hud glass">
              <div className="hud-label">{project.kpi.label}</div>
              <div className="hud-val" style={{ color: project.kpi.good(kpiVal !== null ? kpiVal : 0) ? "#22C55E" : "#fdcb6e" }}>
                {kpiVal !== null ? fmt(kpiVal, project.kpi.dec) : "s/d"}
                <span className="hud-unit">{project.kpi.unit}</span>
              </div>
            </div>
            <div className="scenectl glass int">
              <div className="ctl-grp">
                <button className="ctl" title="Reiniciar cámara" onClick={() => camCmd("reset")}>⟲</button>
                <button className="ctl" title="Vista superior" onClick={() => camCmd("top")}>⬒</button>
                <button className="ctl" title="Vista isométrica" onClick={() => camCmd("iso")}>◈</button>
              </div>
              <div className="ctl-sep" />
              <div className="ctl-grp ctl-speed">
                {[1, 2, 4, 8].map((sp) => (
                  <button key={sp} className={"ctl" + (speed === sp ? " on" : "")} onClick={() => setSpeed(sp)}>{sp}×</button>
                ))}
              </div>
            </div>
            <div className={"panel glass" + (sheet ? " up" : "")}>
              <button className="grab int" onClick={() => setSheet((v) => !v)} aria-expanded={sheet} aria-label={sheet ? "Contraer panel" : "Expandir panel"}>
                <span className="grab-b" />
                <span className="grab-t">{sheet ? "▾ contraer · ver escena" : "▴ expandir · leer todo"}</span>
              </button>
              <div className="panel-body int">
              {project.fidelidad && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "0 0 12px" }}>
                  <span style={{ flexShrink: 0, padding: "3px 9px", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: "0.78em", letterSpacing: "0.03em",
                    background: project.fidelidad.nivel === "A" ? "#1baf7a" : project.fidelidad.nivel === "B" ? "#2a78d6" : "#eda100" }}
                    title={project.fidelidad.nivel === "A" ? "Física publicada, validada contra medición" : project.fidelidad.nivel === "B" ? "Empírico calibrado o física simplificada defendible" : "Heurística ilustrativa"}>
                    Modelo {project.fidelidad.nivel}
                  </span>
                  <span style={{ fontSize: "0.8em", color: "#898781", lineHeight: 1.35 }}>
                    {project.fidelidad.nota}{" "}
                    <a href={"/" + project.fidelidad.hoja} target="_blank" rel="noreferrer"
                      style={{ color: project.fidelidad.nivel === "A" ? "#1baf7a" : project.fidelidad.nivel === "B" ? "#2a78d6" : "#eda100", fontWeight: 600, whiteSpace: "nowrap" }}>
                      ver supuestos →
                    </a>
                  </span>
                </div>
              )}
              <div className="simbox">
                <div className="simbox-h">◈ ESTO ES UNA SIMULACIÓN</div>
                <p className="simbox-t">Los datos que ves corriendo los genera un simulador en tu navegador, no sensores. Lo construí así a propósito: demuestra qué decide un gemelo digital, qué variables importan y qué umbrales disparan qué acción, sin necesitar la planta instalada.</p>
                <div className="simbox-n">
                  <span className="simbox-p">{project.nivel.p}</span>
                  <span className="simbox-l">nivel en mi ruta de 7 proyectos</span>
                </div>
                <p className="simbox-t">{project.nivel.txt}</p>
                <button className="simbox-b int" onClick={() => setView("ruta")}>Ver la ruta: estudiante → especialista →</button>
              </div>
              {project.nota && (
                <div style={{ margin: "10px 0", padding: "8px 10px", borderLeft: "3px solid #1baf7a", background: "rgba(27,175,122,0.08)", fontSize: "0.82em", color: "#1baf7a", fontWeight: 600 }}>
                  ● {project.nota}
                </div>
              )}
              <div className="sec-t">Sobre el proyecto</div>
              <p className="ptext">{project.long}</p>
              <div className="sec-t">Especificaciones (del documento técnico)</div>
              <ul className="specs">{project.specs.map((sp, i) => <li key={i}>{sp}</li>)}</ul>
              <div className="sec-t">Stack del diseño real</div>
              <div className="stack">{project.stack.map((sk) => <span key={sk} className="chip">{sk}</span>)}</div>
              <div style={{ fontSize: "0.75em", color: "#898781", marginTop: 4 }}>Este portafolio corre en React 19 + Vite + Three.js; los chips describen el sistema que se construiría.</div>
              {project.action && (
                <>
                  <div className="sec-t">Control bidireccional (UI → simulador)</div>
                  <button className="btn act int" onClick={() => { rt.cmds[project.action.cmd] = true; }}>{project.action.label}</button>
                </>
              )}
              {project.toggle && (
                <>
                  <div className="sec-t">{project.toggle.title}</div>
                  <button
                    className="btn act int"
                    aria-pressed={toggleOn}
                    onClick={() => setToggleOn((v) => { const nv = !v; rt.cmds[project.toggle.cmd] = nv; return nv; })}
                  >
                    {project.toggle.label}: {toggleOn ? project.toggle.on : project.toggle.off}
                  </button>
                </>
              )}
              <div className="sec-t">Variables en vivo <span className="clock">{data.clock || ""}</span>
                {project.mqtt && (
                  <span style={{ marginLeft: 8, fontSize: "0.72em", fontWeight: 600, letterSpacing: "0.03em", color: feed.live ? "#1baf7a" : "#898781" }}>
                    {feed.live
                      ? `● DATO REAL · hace ${Math.max(0, Math.round((Date.now() - feed.lastTs) / 1000))} s`
                      : `○ SIMULADO${feed.lastTs ? " · última señal hace " + Math.round((Date.now() - feed.lastTs) / 1000) + " s" : ""}`}
                  </span>
                )}
              </div>
              <div className="vars">
                {project.vars.map((v) => (
                  <div key={v.key} className="var-row">
                    <div>
                      <div className="var-name">{v.label}</div>
                      <div className="var-val">
                        {typeof data[v.key] === "number" ? fmt(data[v.key], v.dec) : typeof data[v.key] === "string" ? data[v.key] : "s/d"} <span className="var-unit">{v.unit}</span>
                      </div>
                    </div>
                    <Spark vals={histRef.current[v.key]} />
                  </div>
                ))}
              </div>
              <div className="sec-t">Registro de eventos</div>
              <div className="logbox">
                {log.length ? (
                  log.map((l, i) => (
                    <div key={i} className={"logline" + (l.m.startsWith("✖") ? " bad" : l.m.startsWith("⚠") || l.m.startsWith("🔥") || l.m.startsWith("🟡") ? " warn" : "")}>
                      <span className="logt">{l.t}</span>{l.m}
                    </div>
                  ))
                ) : (
                  <div className="logline dim">esperando eventos…</div>
                )}
              </div>
              <div className="sec-t">Enlaces</div>
              <div className="pcard-btns">
                {project.repo ? (
                  <a className="btn ghost int" href={project.repo} target="_blank" rel="noreferrer">GitHub</a>
                ) : (
                  <span className="btn ghost off">GitHub · pronto</span>
                )}
                {project.video ? (
                  <a className="btn ghost int" href={project.video} target="_blank" rel="noreferrer">Video demo</a>
                ) : (
                  <span className="btn ghost off">Video · pronto</span>
                )}
              </div>
              </div>
            </div>
            <div className="watermark">◈ simulación · datos generados, no medidos · la lógica y los umbrales son reales</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= ESTILOS SOLARPUNK ================= */
