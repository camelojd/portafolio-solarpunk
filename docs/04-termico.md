# REFUGIO-VIVO (04): modelo térmico con coeficientes reales

## Qué estaba mal

El modelo anterior atenuaba la temperatura con un factor inventado de "aislamiento"
en escala 0–1 (`aislaGuadua: 0.9`, `aislaAcero: 0.15`). Tenían la forma correcta
(guadua aísla, acero no) pero **no eran valores físicos** ni citables. Un revisor
técnico pregunta "¿0,9 qué?" y no hay respuesta.

## El modelo nuevo: sol-aire + balance de U reales

Ahora el interior sale de un balance térmico en régimen permanente con la
**transmitancia térmica U (W/m²K)** real del techo.

1. **Temperatura sol-aire** (concepto ASHRAE): el techo asoleado se calienta por
   encima del aire exterior según su absortancia solar `α = 1 − albedo`:

   ```
   T_sol-aire = T_ext + (α · I) / h_o
   ```

   con `I` la irradiancia sobre el techo (W/m²) y `h_o = 25 W/m²K` el coeficiente de
   película exterior (ISO 6946, Rse = 0,04 → h_o = 1/Rse).

2. **Balance estacionario del interior**: conduce por el techo (`U_techo`) hacia la
   sol-aire y por el resto de la envolvente (`U_g`) hacia el aire exterior, más las
   ganancias internas de los animales (`q_int`):

   ```
   T_int = (U_techo · T_sol-aire + U_g · T_ext + q_int) / (U_techo + U_g)
   ```

Un techo conductor (acero, U alto) arrastra el interior hacia la sol-aire caliente;
uno aislante (guadua, U bajo) lo mantiene cerca del aire exterior. Ese es exactamente
el comportamiento físico que antes se imponía a mano.

## Valores U y fuentes

| Material | U [W/m²K] | Base / fuente |
|----------|-----------|---------------|
| Guadua (techo) | **0,9** | Ensamblaje multicapa de bambú U ≈ 0,67 W/m²K (3 capas); conductividad medida del compuesto 0,12–0,17 W/mK. Se toma 0,9 como techo típico (menos capas que un muro). |
| Acero (chapa de contenedor) | **6,0** | La conducción del acero (λ ≈ 50 W/mK) es despreciable frente a las películas de aire; U lo dominan Rsi 0,10 + Rse 0,04 (ISO 6946) → U ≈ 6. |

Constantes del balance (supuestos documentados, no medidos):

| Parámetro | Valor | Nota |
|-----------|-------|------|
| `h_o` | 25 W/m²K | ISO 6946, película exterior. |
| `U_g` | 2,5 W/m²K | Acoplamiento interior-exterior por muros y ventilación. Supuesto. |
| `q_int` | 10 W/m² | Ganancias internas de los animales por m² de techo. Supuesto. |
| `I_max` | 900 W/m² | Irradiancia pico sobre el techo. |

> **`// TODO: fuente techo-específica de guadua.`** Las citas sólidas disponibles son
> de **muros** multicapa de bambú, no de techos. El valor 0,9 W/m²K es una estimación
> razonable para un techo, pero un número medido de un ensamblaje de techo de guadua
> reforzaría el modelo. Marcado en el código y pendiente.

## Resultado

Con el modelo nuevo, un día de Bogotá (T_ext 8–20 °C):

| Techo | Medianoche | Mediodía | Amplitud |
|-------|-----------:|---------:|---------:|
| Guadua (U 0,9) | 11,2 °C | 27,3 °C | ~16 °C |
| Acero (U 6,0) | 9,4 °C | **37,0 °C** | ~28 °C |

El techo de acero convierte el refugio en un horno de **37 °C** al mediodía; la
guadua se queda en **27 °C**, dentro o cerca del rango de confort de todas las
especies. De noche la guadua retiene mejor el calor de los animales (11,2 vs 9,4 °C).
Todo esto sale de U reales, no de un factor de forma.

## Experimento para validarlo (rediseñado)

El modelo es comparativo; para anclarlo a la realidad, un experimento barato y
reproducible:

- **Dos cajas de 1 m³** idénticas salvo el techo: una con techo de guadua, otra con
  chapa de acero (o lámina de contenedor). Mismo lote, misma orientación, mismo día.
- **Sensor DS18B20** dentro de cada caja (~8.000 COP c/u), más uno al aire exterior
  como referencia. Registro cada 10 min, **una semana** para atrapar días soleados y
  nublados.
- **Qué se mide:** amplitud interior día-noche y pico de mediodía de cada caja frente
  al exterior. La predicción del modelo: la caja de acero debe mostrar un pico de
  mediodía muy superior (del orden de 8–10 °C sobre la de guadua) y mayor amplitud.
- **Criterio:** si la diferencia de picos medida cae en el orden que predice el
  modelo, el modelo sirve para comparar diseños. Si no, se recalibran `U_g` y `q_int`
  (los dos supuestos) contra el dato real.

## Dónde el modelo deja de ser válido

- Es **estacionario**: no modela la inercia térmica (masa del techo, retardo de
  fase). Un techo pesado (adobe) real amortigua en el tiempo, no solo en amplitud;
  este modelo no lo captura.
- `U_g` y `q_int` son supuestos, no medidos: el experimento de arriba existe justo
  para acotarlos.
- Un mismo `T_int` para todos los refugios del mismo material es una simplificación
  (ignora tamaño, orientación y sombras entre refugios).
- No es CFD: no dice nada de estratificación del aire ni de corrientes internas.
