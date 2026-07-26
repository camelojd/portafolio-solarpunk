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
resultante, con una alerta de 4 niveles y los minutos de anticipación al desborde al ritmo
de entrada actual.

## Qué tan real es

Es una simulación, pero la **lluvia de entrada es real**: la serie horaria de la estación
de IDEAM en Kennedy (octubre-noviembre 2024, vía datos.gov.co), con sus aguaceros
vespertinos de verdad. El modelo de la cadena hidráulica (sumideros, humedal, canal) es
defendible pero **no está validado contra un desborde real**, y el nivel del canal es
modelado, no medido. Es nivel **B**. Detalle en la [hoja de supuestos](../supuestos/10-canal-alerta.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js), con
la serie de lluvia real de IDEAM embebida.
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Conseguir el ground-truth de un desborde real (registros de IDIGER) y un sensor de nivel
vivo, para validar la anticipación contra la hora real del agua en la calle.
