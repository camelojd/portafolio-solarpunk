# Caso de estudio: AQUA-SERVE

**Dominio:** Infraestructura de datos / gestión hídrica · **Fidelidad: B**

## Por qué

Los datacenters de IA que están llegando a Colombia consumen cantidades enormes de
agua y energía solo en enfriarse. La visión solarpunk plantea captar agua lluvia del
edificio, filtrarla y usarla en el circuito de enfriamiento líquido directo (DLC). El
gancho original eran unas microturbinas en los bajantes; la honestidad me obligó a
cambiar el eje.

## Qué modela el gemelo

El eje es el **agua, no la energía**: cuántos litros capta la cubierta (área × lluvia ×
coeficiente de escorrentía) frente a los litros que demanda el enfriamiento, calculados
con el WUE (Water Usage Effectiveness, el agua por kWh de cómputo), y qué fracción de
esa demanda paga la lluvia. En paralelo modela la temperatura de los racks, el DLC y el
PUE.

## Qué tan real es

Es una simulación. Las turbinas dan unos **180 W pico, menos del 0,1 %** del consumo del
datacenter: por eso son un detalle anecdótico, no una fuente de energía, y el eje es el
balance hídrico. La física del balance usa parámetros de fuentes reales (WUE de The
Green Grid, coeficiente de escorrentía), pero la lluvia que lo alimenta es **sintética**
y no está validado contra el consumo medido de un datacenter. Es nivel **B**. Detalle en
la [hoja de supuestos](../supuestos/02-aqua-serve.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js).
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Validar contra el consumo de agua medido de un datacenter real, o alimentar el balance
con lluvia real (como se hace en CANAL-ALERTA).
