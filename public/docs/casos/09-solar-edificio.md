# Caso de estudio: SOLAR-EDIFICIO

**Dominio:** Energía / autoconsumo fotovoltaico · **Fidelidad: B**

## Por qué

En un edificio con paneles solares, la pregunta que importa no es cuánta energía genero,
sino si esa generación alcanza a cubrir lo que consumo hora a hora. El sol no es
constante y el consumo tampoco (sube con la climatización, baja de noche). Sin seguir ese
balance uno termina sobredimensionando batería y paneles, o quedándose corto justo cuando
más lo necesita. Es el tipo de dato que piden certificaciones como EDGE o LEED y la
normativa colombiana de autogeneración (Ley 1715/2014, CREG 030).

## Qué modela el gemelo

La generación fotovoltaica, el consumo (climatización, iluminación, equipos), el balance
neto y el estado de carga de una batería LFP, latiendo en vivo. El comando de ventilación
cruzada cambia las renovaciones de aire y, con eso, la temperatura interior y el consumo.

## Qué tan real es

Aquí corregí un hype importante. La versión anterior afirmaba usar **el algoritmo SPA del
NREL y el modelo Perez-Ineichen**. No es cierto: el recurso solar es un **sinusoide
simple**, no geometría solar real. Lo que sí es física de literatura es el modelo
fotovoltaico: derrateo por temperatura (−0,35 %/°C, típico de silicio cristalino) y
temperatura de celda tipo NOCT.

Lo valioso es que este es el gemelo **más validado**: lo comparé contra el año
meteorológico típico real de Bogotá (PVGIS) y publiqué el error. Hallazgo: con la
irradiancia sintética el modelo **sobreestima la generación anual en +40 %** (hasta +54 %
en meses lluviosos), porque su nubosidad aleatoria no captura la bimodalidad de lluvias
de Bogotá. Se puede conmutar a irradiancia real (TMY de PVGIS) con un toggle. Método,
tabla de error y gráfica en [docs/09-validacion.md](../09-validacion.md).

Es nivel **B**: está validado contra medición (la mitad de un A), pero le falta el
algoritmo publicado (SPA/Perez). Es el B más cerca de A del portafolio.

## Cómo está construido

- **Hoy (lo que corre):** simulador en JavaScript en la SPA (React 19 + Vite + Three.js),
  con toggle de irradiancia sintética o TMY real de PVGIS.
- **Diseño de producción objetivo:** inversor por Modbus TCP, medidores por circuito, Python + Unity.
- **En vivo:** [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Implementar NREL SPA (o el algoritmo de Grena) más la transposición de Perez; la
validación contra PVGIS ya existe.
