# Caso de estudio: CANAL-ALERTA

**Dominio:** Smart city / gestión de riesgo hídrico · **Fidelidad: B**

## Por qué

Cada temporada de lluvias, Bogotá repite la misma escena: aguaceros cortos e intensos,
sumideros tapados por basura, canales al límite y barrios como Kennedy o Bosa con el agua
adentro. La variable que casi nadie modela, y que aquí es protagonista, es la basura: la
capacidad de los sumideros cae a medida que se acumula, y eso agrava el encharcamiento
mucho antes de que el canal se desborde. A quien tiene que evacuar un sótano o cerrar una
vía no le sirve "está lloviendo duro"; le sirve cuántos minutos quedan antes del desborde.

## Qué modela el gemelo

La cadena hidráulica completa: lluvia, obstrucción progresiva de los sumideros por basura
(con despeje por cuadrilla), amortiguamiento del humedal y los SUDS, y el nivel del canal
resultante, con una alerta de 4 niveles y los minutos de anticipación al desborde al
ritmo de entrada actual.

## Qué tan real es

La lluvia que alimenta el modelo dejó de ser aleatoria: ahora es la **serie horaria real
de la estación de IDEAM en Kennedy** (octubre-noviembre 2024, vía datos.gov.co), con sus
aguaceros vespertinos de verdad (pico 20,2 mm/h). Y al alimentarlo con dato real apareció
un hallazgo honesto: **con la lluvia real el canal no desborda** (nivel máximo 27 %). No
es un bug: la hidráulica estaba calibrada para el aguacero sintético de 40 mm/h sostenido
del botón, más duro que la lluvia real horaria de esa temporada. Es justo el tipo de cosa
que solo se aprende probando contra la realidad, y quedó documentada en vez de escondida.
Método y hallazgo en [docs/10-validacion.md](../10-validacion.md).

Es nivel **B**: modelo de embalses defendible con lluvia real de entrada, pero **sin
validar contra un desborde real** (en la ventana elegida no ocurrió uno registrado). El
nivel del canal es modelado, no medido.

## Cómo está construido

- **Hoy (lo que corre):** simulador en JavaScript en la SPA (React 19 + Vite + Three.js),
  con la serie real de IDEAM embebida.
- **Diseño de producción objetivo:** sensores de nivel y pluviómetros por LoRaWAN; entidades
  NGSI-LD sobre FIWARE (el estándar con el que opera el Distrito).
- **En vivo:** [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Conseguir el ground-truth de un desborde real (registros de IDIGER) y un sensor de nivel
vivo, para validar la anticipación contra la hora real del agua en la calle.
