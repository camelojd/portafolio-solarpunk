# AQUA-SERVE (02): tesis reencuadrada

## Qué estaba mal

La versión anterior vendía **energía**: turbinas helicoidales en los bajantes que
"convierten el aguacero en electricidad". El número no aguanta el primer vistazo de
un ingeniero:

- 4 turbinas × 15–45 W = **60–180 W pico**, y solo mientras llueve.
- Un datacenter de IA, incluso pequeño, consume **decenas a cientos de kW**.
- Aporte de las turbinas ≈ **0,05–0,1 %** del consumo. Anecdótico.

Presumir esa cifra como "energía pluvial" era exactamente el tipo de hype que este
portafolio dice rechazar. La turbina se queda, pero como curiosidad honesta, no como
tesis.

## El eje correcto: agua, no energía

Lo valioso de juntar "datacenter" y "lluvia" en Bogotá no es la electricidad: es el
**agua**. El enfriamiento de un datacenter consume agua (torres, evaporativo,
make-up del circuito), y Bogotá recibe ~1000 mm/año que la cubierta deja ir. La
tesis nueva es un **balance hídrico**: litros captados por la cubierta vs. litros que
demanda el enfriamiento.

### Demanda de enfriamiento (WUE)

Se modela con el **WUE** (Water Usage Effectiveness), litros de agua por kWh de
cómputo — la métrica estándar de The Green Grid para el agua de un datacenter.

```
demanda [L/día] = carga_TI [kW] × 24 h × WUE [L/kWh]
```

- WUE de referencia usado en el modelo: **1,0 L/kWh**.
- Contexto: el promedio reportado de la industria ronda **~1,8 L/kWh**; las
  instalaciones más eficientes (líquido directo, sin evaporativo) bajan de **0,2**.
  El WUE es, por tanto, la palanca dominante de todo el balance.

### Captación pluvial

```
captación [L/h] = lluvia [mm/h] × área_cubierta [m²] × coef_escorrentía
```

(1 mm de lluvia sobre 1 m² = 1 L.) Supuestos del modelo:

| Parámetro | Valor | Nota / fuente |
|-----------|-------|---------------|
| Área de captación | 2000 m² | Cubierta de una nave de datacenter pequeño (supuesto). |
| Coef. de escorrentía | 0,8 | Cubierta dura impermeable; método racional, C≈0,7–0,95. |
| Carga TI nominal | 300 kW | Datacenter de borde pequeño (supuesto). |
| WUE | 1,0 L/kWh | The Green Grid; promedio industria ~1,8; mejores <0,2. |
| Precipitación Bogotá | ~1000 mm/año | Climatología IDEAM. |

## El número honesto

Con esos supuestos y la climatología de Bogotá:

- **Captación media:** 2000 m² × 1,0 m/año × 0,8 = 1600 m³/año ≈ **4380 L/día**.
- **Demanda** a 60 % de utilización (180 kW): 180 × 24 × 1,0 ≈ **4320 L/día**.
- **Cobertura ≈ 100 %** en el punto medio.

Pero la conclusión honesta es la **sensibilidad al WUE**, no un número único:

| WUE [L/kWh] | Demanda [L/día] | Cobertura por lluvia |
|-------------|-----------------|----------------------|
| 0,2 (mejor) | 864 | > 200 % (sobra agua) |
| 1,0 (modelo) | 4320 | ~100 % |
| 1,8 (promedio) | 7780 | ~56 % |

> **La lluvia de una cubierta de 2000 m² en Bogotá puede cubrir de la mitad a la
> totalidad del agua de enfriamiento de un datacenter de 300 kW, según su WUE.**

Eso sí es una tesis defendible frente a un operador o un criterio ESG: el agua es un
costo y un riesgo reputacional reales, y la captación pluvial los reduce de forma
medible. La electricidad de las turbinas, no.

## Las turbinas, con su número

Se mantienen como detalle: la UI muestra su potencia (`~180 W pico`) y, al lado, su
aporte real (`turbPct`), que se mantiene **bajo el 0,1 %** del consumo del
datacenter. La física manda: potencia hidráulica `P = ρ·g·Q·H·η`, y con la cabeza de
un bajante (~10 m) y el caudal de una cubierta, el resultado son vatios, no kW —
por eficiente que sea la turbina.

## Dónde el modelo deja de ser válido

- El WUE real de una instalación concreta puede estar en cualquier punto del rango
  0,2–1,8; el balance hereda esa incertidumbre. El modelo expone el supuesto, no lo
  esconde.
- La captación en vivo sigue la lluvia sintética del simulador (este gemelo no usa
  serie real; ese trabajo es el de CANAL-ALERTA). Las cifras anuales de arriba usan
  la climatología real de Bogotá; la dinámica en pantalla es ilustrativa.
- No se modela la calidad del agua captada ni el tratamiento necesario antes de
  entrar al circuito (la cadena de filtración está en las specs, sin dimensionar).

## Fuentes

- The Green Grid — métrica WUE (Water Usage Effectiveness) para datacenters.
- Rangos de WUE de industria (promedio ~1,8 L/kWh; mejores <0,2) — reportes de
  eficiencia de datacenters. `// TODO: fijar cita puntual (LBNL US DC Energy Report / Uptime Institute)`.
- Coeficiente de escorrentía para cubiertas — método racional (manuales de drenaje urbano).
- Precipitación media de Bogotá — climatología IDEAM.
