# Caso de estudio: AQUA-SERVE

**Dominio:** Infraestructura de datos / gestión hídrica · **Fidelidad: B**

## Por qué

Los datacenters de IA que están llegando a Colombia consumen cantidades enormes de
agua y energía solo en enfriarse. La visión solarpunk plantea captar agua lluvia del
edificio, filtrarla y usarla en el circuito de enfriamiento líquido directo (DLC). El
gancho original eran unas microturbinas en los bajantes; la honestidad me obligó a
cambiar el eje (ver abajo).

## Qué modela el gemelo

El eje es el **agua, no la energía**: cuántos litros capta la cubierta (área × lluvia ×
coeficiente de escorrentía) frente a los litros que demanda el enfriamiento, calculados
con el WUE (Water Usage Effectiveness, el agua por kWh de cómputo), y qué fracción de
esa demanda paga la lluvia. En paralelo modela la temperatura de los racks, el DLC y el
PUE. La tesis, con supuestos y sensibilidad al WUE, está en [docs/02-tesis.md](../02-tesis.md).

## Qué tan real es

Aquí corregí un hype: las turbinas dan unos **180 W pico, menos del 0,1 %** del consumo
del datacenter. Presentarlas como "energía pluvial" no aguantaba el primer vistazo de un
ingeniero, así que pasaron a detalle anecdótico, con su porcentaje real visible, y el eje
se volvió el balance hídrico, que sí es una métrica que un operador y un criterio ESG
miran. La física del balance está citada (WUE de The Green Grid, coeficiente de
escorrentía); la lluvia que lo alimenta es **sintética**, no real.

Es nivel **B**: física simplificada y defendible, con parámetros de fuentes reales, sin
validación contra el consumo medido de un datacenter (ver [hoja de supuestos](../supuestos/02-aqua-serve.md)).

## Cómo está construido

- **Hoy (lo que corre):** simulador en JavaScript en la SPA (React 19 + Vite + Three.js).
- **Diseño de producción objetivo:** simulador Python + Unity + MQTT, con InfluxDB/Grafana para ESG.
- **En vivo:** [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Validar contra el consumo de agua medido de un datacenter real, o alimentar el balance
con lluvia real (como se hizo en CANAL-ALERTA).
