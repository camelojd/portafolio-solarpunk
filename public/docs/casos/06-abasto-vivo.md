# Caso de estudio: ABASTO-VIVO

**Dominio:** Logística humanitaria / rescate de alimentos · **Fidelidad: C**

## Por qué

En Colombia se pierde comida en buen estado todos los días por una logística de rescate
deficiente, mientras miles de hogares viven inseguridad alimentaria. Bancos de alimentos
como ABACO conectan excedentes con comunidades vulnerables, pero dentro de un centro de
distribución grande, coordinar una flota de robots que además tenga en cuenta que cada
lote donado vence en una fecha distinta es un problema real. Quería que los robots
prioricen mover la comida según qué tan cerca esté de dañarse, para que ninguna donación
se pierda por llegar tarde.

## Qué modela el gemelo

Una flota de 5 robots móviles (AMR) con su batería, sus rutas y la lógica **FEFO (First
Expired, First Out)**: cada lote entra a una cola con su fecha de caducidad, y los AMRs
despachan primero lo más próximo a vencer. Un AMR bajo el 20 % de batería sale solo a
cargar. Se puede inyectar un lote nuevo o bloquear un pasillo por comando. Métricas en
vivo: raciones/hora, kg rescatados, backlog y lotes en riesgo.

## Qué tan real es

Es nivel **C**, y lo digo sin rodeos: la lógica de colas y priorización FEFO es
razonable, pero **no hay robot real ni cliente**, y todos los umbrales son criterios
propios de demostración. Está en standby hasta tener un banco de alimentos que valide si
la lógica tiene sentido en su operación. El valor hoy es mostrar la lógica de decisión,
no reproducir una planta real. Detalle en la [hoja de supuestos](../supuestos/06-abasto-vivo.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js).
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a B/A

Un piloto real con un AMR y datos de operación de un banco de alimentos.
