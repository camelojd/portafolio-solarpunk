# Caso de estudio: OBRA-VIVA

**Dominio:** Construcción / seguridad y gestión ambiental · **Fidelidad: B**

## Por qué

La construcción mueve cerca del 9 % del PIB y choca con las comunidades vecinas por
vibración, ruido a deshoras y polvo, además del riesgo catastrófico de un talud que falla
cuando nadie lo mide. Lo curioso es que casi todas esas normas ya existen (DIN 4150-3
para vibración, ISO 7243 para estrés térmico, Res. 2254/2017 para material particulado,
NSR-10 Título H para taludes), pero sin monitoreo continuo uno se entera del problema
cuando ya llegó la queja, la multa o el accidente.

## Qué modela el gemelo

Una red de vigilancia perimetral que publica vibración PPV, ruido Leq, PM10/PM2.5,
desplazamiento del inclinómetro del talud, nivel freático e índice WBGT, cada uno
comparado contra su norma. Dispara aspersión automática por PM10 sostenido y protocolo de
paralización ante desplazamiento del talud. La escena pinta el riesgo combinado como un
mapa de calor sobre postes perimetrales.

## Qué tan real es

Es una simulación, pero es el gemelo **mejor referenciado**: cada umbral de alerta sale
de normativa citada (DIN, ISO, Resoluciones colombianas, NSR-10). Eso lo hace defendible
sin discusión. El modelo que genera las señales es heurístico, y le falta un histórico
real de sensores de una obra para cerrar el lazo; por eso es nivel **B** y no A. Detalle
por umbral en la [hoja de supuestos](../supuestos/07-obra-viva.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js).
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Validar los umbrales normativos contra un histórico real de sensores de una obra.
