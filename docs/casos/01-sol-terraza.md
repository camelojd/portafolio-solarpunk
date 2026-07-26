# Caso de estudio: SOL-TERRAZA

**Dominio:** Agricultura urbana / hidroponía · **Fidelidad: B**

## Por qué

Un cultivo hidropónico urbano (terrazas, azoteas, huertos comunitarios) depende de
variables delicadas: temperatura, pH, conductividad eléctrica (CE) y nivel de agua.
Todas tienen que mantenerse en rango para que las plantas estén sanas, y revisarlas a
mano es lento y propenso a errores: cuando algo se sale de control, uno se entera
tarde y ahí es donde se pierden cosechas. Este fue mi punto de partida en gemelos
digitales porque el bucle es real y los sensores son baratos.

## Qué modela el gemelo

Un simulador del cultivo que corre en vivo: temperatura, humedad, pH, CE, nivel de
depósito, batería y luz, con las reglas de decisión que escribí a partir del documento
técnico (si el pH baja de 5,8 dosifica KOH, si el tanque baja del 20 % abre la válvula
de red, de noche entra en modo ahorro). Las plantas de la escena 3D cambian de color
según la severidad del estado.

## Qué tan real es

Es una simulación. El modelo del cultivo es heurístico: relaja las variables hacia sus
objetivos con esas reglas. Los umbrales agronómicos son coherentes con guías de
hidroponía de hoja, pero sin cita puntual verificada ni validación contra una serie
real. Es nivel **B**: lógica razonable, sin validación. Detalle por variable en la
[hoja de supuestos](../supuestos/01-sol-terraza.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js).
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Validar el modelo del cultivo contra una serie histórica real o un ensayo controlado.
