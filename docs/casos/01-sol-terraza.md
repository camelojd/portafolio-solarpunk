# Caso de estudio: SOL-TERRAZA

**Dominio:** Agricultura urbana / hidroponía · **Fidelidad: B**

## Por qué

Un cultivo hidropónico urbano (terrazas, azoteas, huertos comunitarios) depende de
variables delicadas: temperatura, pH, conductividad eléctrica (CE) y nivel de agua.
Todas tienen que mantenerse en rango para que las plantas estén sanas, y revisarlas a
mano es lento y propenso a errores: cuando algo se sale de control, uno se entera
tarde y ahí es donde se pierden cosechas. Este fue mi punto de partida en gemelos
digitales porque el bucle es real y los sensores son baratos (menos de 30.000 COP).

## Qué modela el gemelo

Un simulador del cultivo que corre en vivo: genera temperatura, humedad, pH, CE,
nivel de depósito, batería y luz, con las reglas de decisión que escribí a partir del
documento técnico (si el pH baja de 5,8 dosifica KOH, si el tanque baja del 20 % abre
la válvula de red, de noche entra en modo ahorro). Las plantas de la escena 3D
cambian de color según la severidad del estado.

## Qué tan real es

Este gemelo cruzó de "simulado" a "con dato real": un **nodo ESP32 real** puede
publicar por MQTT su temperatura, humedad y luz (sensores SHT30 + BH1750), y el modelo
las consume en vivo. Cuando llega el dato real la UI lo declara ("DATO REAL"), y las
plantas reaccionan a la temperatura medida. El pH y la CE quedan simulados a propósito:
sus electrodos derivan y necesitan calibración, no aportan a una ingesta honesta. El
pipeline completo está en [docs/01-mqtt.md](../01-mqtt.md).

Es nivel **B**: sensores reales de aquí en adelante, pero el modelo del cultivo sigue
siendo heurístico y no está validado contra una serie histórica. Los umbrales
agronómicos son coherentes con guías de hidroponía de hoja pero sin cita puntual
verificada (ver [hoja de supuestos](../supuestos/01-sol-terraza.md)).

## Cómo está construido

- **Hoy (lo que corre):** simulador en JavaScript dentro de la SPA del portafolio
  (React 19 + Vite + Three.js), con ingesta MQTT real por mqtt.js y firmware ESP32.
- **Diseño de producción objetivo:** simulador Python + visualización Unity + MQTT.
- **En vivo:** [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Validar el modelo del cultivo contra una serie histórica real (no solo ingesta en
vivo), o contra un ensayo controlado.
