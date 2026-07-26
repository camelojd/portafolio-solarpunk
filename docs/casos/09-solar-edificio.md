# Caso de estudio: SOLAR-EDIFICIO

**Dominio:** Energía / autoconsumo fotovoltaico · **Fidelidad: B**

## Por qué

En un edificio con paneles solares, la pregunta que importa no es cuánta energía genero,
sino si esa generación alcanza a cubrir lo que consumo hora a hora. El sol no es constante
y el consumo tampoco (sube con la climatización, baja de noche). Sin seguir ese balance
uno termina sobredimensionando batería y paneles, o quedándose corto justo cuando más lo
necesita. Es el tipo de dato que piden certificaciones como EDGE o LEED y la normativa
colombiana de autogeneración (Ley 1715/2014, CREG 030).

## Qué modela el gemelo

La generación fotovoltaica, el consumo (climatización, iluminación, equipos), el balance
neto y el estado de carga de una batería LFP, latiendo en vivo. El comando de ventilación
cruzada cambia las renovaciones de aire y, con eso, la temperatura interior y el consumo.

## Qué tan real es

Es una simulación. El recurso solar es una **curva aproximada** (un sinusoide), no
geometría solar real; lo que sí es física de literatura es el modelo fotovoltaico:
derrateo por temperatura (−0,35 %/°C, típico de silicio cristalino) y temperatura de celda
tipo NOCT. El gemelo **puede alimentarse con la irradiancia real de Bogotá** (año
meteorológico típico de PVGIS), conmutable con la sintética mediante un toggle. Es nivel
**B**. Detalle en la [hoja de supuestos](../supuestos/09-solar-edificio.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js), con
un toggle de irradiancia sintética o real de PVGIS.
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Implementar la posición solar con NREL SPA (o el algoritmo de Grena) más la transposición
de Perez, para que el recurso solar deje de ser una curva aproximada.
