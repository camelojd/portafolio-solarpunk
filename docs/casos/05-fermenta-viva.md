# Caso de estudio: FERMENTA-VIVA

**Dominio:** Biotecnología / fermentación de precisión · **Fidelidad: B**

## Por qué

La ganadería lechera tiene una huella ambiental que ya nadie discute: tierra, agua,
metano y el bienestar de millones de vacas detrás de cada litro. La fermentación de
precisión es una apuesta seria para desacoplar la proteína láctea (caseína) de la vaca:
se programa un microorganismo para producirla en un biorreactor, en un lote fed-batch
controlado. Ese control por lotes tiene un estándar real detrás, la familia **ISA-88
(IEC 61512)**. Quería que el gemelo corriera la máquina de estados real de un lote, con
su riesgo de contaminación, y que la productividad se calculara con datos de la
simulación, no como una cifra inventada.

## Qué modela el gemelo

La máquina de estados fed-batch completa: Inoculación, Crecimiento, Producción, Cosecha
y CIP (limpieza), con la rama de contaminación (espontánea o por comando) que aborta el
lote. La productividad sale del título de proteína alcanzado, traducido a litros de leche
animal no necesarios y vacas ahorradas al año.

## Qué tan real es

Es una simulación. La **estructura por fases sigue ISA-88**, un estándar real
implementado, y la productividad se deriva del título de proteína de la simulación (no de
un número al azar). Pero la **cinética del cultivo es heurística** (relajación a
setpoints), no la cinética de Monod publicada; por eso es nivel **B** y no A. No hay
biorreactor al otro lado, y los setpoints son valores de proceso plausibles, no medidos.
Detalle en la [hoja de supuestos](../supuestos/05-fermenta-viva.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js).
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Reemplazar la relajación a setpoints por **cinética de Monod** con parámetros de
literatura, y validar la curva de crecimiento contra datos publicados.
