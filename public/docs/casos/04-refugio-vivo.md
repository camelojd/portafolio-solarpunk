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

El corazón térmico dejó de ser inventado. Antes atenuaba la temperatura con un factor
de "aislamiento" en escala 0 a 1 sin unidades. Ahora usa un **balance sol-aire en
régimen permanente con valores U reales de literatura**: guadua U ≈ 0,9 W/m²K (estudios
de muro multicapa de bambú) y acero U ≈ 6 W/m²K (ISO 6946, la chapa no aísla). El
resultado sale de física, no de un factor de forma: techo de acero **37 °C** vs guadua
**27 °C** al mediodía. Método, fuentes y experimento de validación en
[docs/04-termico.md](../04-termico.md).

Es nivel **B**: física simplificada con coeficientes reales, sin validar contra
medición. El modelo es estacionario (no capta la inercia térmica), y dos parámetros
(acoplamiento de la envolvente y ganancias internas) son supuestos documentados.

## Cómo está construido

- **Hoy (lo que corre):** simulador en JavaScript en la SPA (React 19 + Vite + Three.js).
- **Diseño de producción objetivo:** simulador Python + Unity + MQTT.
- **En vivo:** [portafolio-solarpunk.vercel.app](https://portafolio-solarpunk.vercel.app)

## Camino a A

Correr el experimento de las dos cajas de 1 m³ con sensores DS18B20 (unos 8.000 COP c/u)
y ajustar los dos supuestos al dato medido. Detalle en [docs/04-termico.md](../04-termico.md).
