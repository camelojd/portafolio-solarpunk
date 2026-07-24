/* ================================================================
   Cliente MQTT sobre WebSocket para ingesta de sensores reales.
   Configurable por variables de entorno de Vite. Fallback silencioso:
   sin URL de broker (o ante cualquier fallo) es un no-op y la app corre
   en modo simulado, sin ruido para el usuario.
   ================================================================ */
import mqtt from "mqtt";
import { parseReading } from "./mqttParse.js";

/* Lee la configuracion de import.meta.env. Sin VITE_MQTT_URL => deshabilitado. */
export function readMqttConfig() {
  const env = import.meta.env || {};
  return {
    url: env.VITE_MQTT_URL || "",
    topic: env.VITE_MQTT_TOPIC || "solterraza/sensores",
    timeoutMs: (Number(env.VITE_MQTT_TIMEOUT) || 15) * 1000,
    username: env.VITE_MQTT_USER || undefined,
    password: env.VITE_MQTT_PASS || undefined,
  };
}

/* Arranca la ingesta. Llama onReading({temp,hum,irr,ts}) por cada mensaje valido
   y onStatus({state}) en los cambios de conexion. Devuelve una funcion para cerrar.
   Si no hay broker configurado o la conexion falla, no hace nada (modo simulado). */
export function startMqtt(onReading, onStatus = () => {}) {
  const cfg = readMqttConfig();
  if (!cfg.url) {
    onStatus({ state: "disabled" });
    return () => {};
  }

  let client;
  try {
    client = mqtt.connect(cfg.url, {
      username: cfg.username,
      password: cfg.password,
      reconnectPeriod: 4000,
      connectTimeout: 8000,
      clean: true,
    });
  } catch (err) {
    onStatus({ state: "error", error: String(err) });
    return () => {};
  }

  client.on("connect", () => {
    onStatus({ state: "connected" });
    client.subscribe(cfg.topic, (err) => {
      if (err) onStatus({ state: "error", error: String(err) });
    });
  });
  client.on("reconnect", () => onStatus({ state: "reconnecting" }));
  client.on("error", (err) => onStatus({ state: "error", error: String(err) }));
  client.on("close", () => onStatus({ state: "closed" }));
  client.on("message", (_topic, payload) => {
    const reading = parseReading(payload);
    // El sello de tiempo es la hora de recepcion en el navegador (freshness/timeout).
    if (reading) onReading({ ...reading, ts: Date.now() });
  });

  return () => {
    try { client.end(true); } catch { /* cierre best-effort */ }
  };
}
