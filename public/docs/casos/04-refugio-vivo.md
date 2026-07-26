# Caso de estudio: REFUGIO-VIVO

**Dominio:** Bienestar animal / economía circular · **Fidelidad: B**

## Por qué

Los santuarios de animales rescatados en Colombia rara vez tienen presupuesto para
refugios prefabricados, y sin embargo sobran materiales reciclados que servirían:
contenedores en desuso, madera de demolición, guadua, llantas, adobe. Aprovecharlos
bien no es intuitivo: cada especie necesita un rango de temperatura, y el material del
techo lo cambia todo. Un techo de acero convierte el refugio en un horno al mediodía;
uno de guadua mantiene el interior estable. Sin una herramienta que calcule eso, las
decisiones se toman a ojo y un error sale caro cuando ya se construyó.

## Qué modela el gemelo

Toma el lote, el clima, el inventario de materiales y las especies, y propone un diseño:
dimensiones por especie, material de techo, una curva de temperatura interior de 24
horas, presupuesto en pesos y cronograma. La escena muestra un refugio por especie,
coloreado según si queda en su rango de confort.

## Qué tan real es

Es una simulación. El modelo térmico usa un **balance sol-aire en régimen permanente con
valores U reales de literatura**: guadua U ≈ 0,9 W/m²K (estudios de muro multicapa de
bambú) y acero U ≈ 6 W/m²K (ISO 6946, la chapa no aísla). El resultado sale de física, no
de un factor inventado: techo de acero **37 °C** vs guadua **27 °C** al mediodía. Es
estacionario (no capta la inercia térmica), dos parámetros son supuestos, y no está
validado contra medición. Es nivel **B**. Detalle en la
[hoja de supuestos](../supuestos/04-refugio-vivo.md).

## Cómo está construido

Simulador en JavaScript dentro de la SPA del portafolio (React 19 + Vite + Three.js).
En vivo: [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Un experimento con dos cajas de 1 m³ (una con techo de guadua, otra de acero) y sensores
DS18B20, para ajustar los dos supuestos del modelo al dato medido.
