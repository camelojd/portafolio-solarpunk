# Fidelidad de los gemelos

Qué tan real es cada gemelo, de un vistazo. La etiqueta no es marketing: describe
qué tipo de modelo corre por dentro y cuánto se ha contrastado con la realidad.

## Los tres niveles

- **A — Modelo con física publicada.** Un algoritmo de literatura, verificable e
  implementado tal cual (NREL SPA, cinética de Monod, red RC), **y validado contra
  medición real**. Las dos mitades: algoritmo publicado *e* validación.
- **B — Modelo empírico calibrado.** Lógica razonable con parámetros de fuentes
  reales, o física simplificada pero defendible. Sin validación completa contra
  medición.
- **C — Heurística ilustrativa.** Reglas escritas a mano con fines educativos o de
  demostración.

## Los 8 gemelos

Hoy **ninguno es A**: los dos candidatos (05, 09) no cumplen la mitad de "algoritmo
publicado" todavía. Preferimos decirlo a inflar la etiqueta.

| Gemelo | Nivel | Por qué | Hoja de supuestos |
|--------|:-----:|---------|-------------------|
| 01 sol-terraza | **B** | Sensores reales por MQTT (T2); modelo heurístico, sin validación histórica. | [01](supuestos/01-sol-terraza.md) |
| 02 aqua-serve | **B** | Balance hídrico con física citada (WUE, escorrentía). Lluvia **sintética**. | [02](supuestos/02-aqua-serve.md) |
| 04 refugio-vivo | **B** | Valores U reales (ISO 6946 + literatura) y modelo sol-aire. Sin validar en cajas. | [04](supuestos/04-refugio-vivo.md) |
| 05 fermenta-viva | **B** | ISA-88 (IEC 61512) real implementado; cinética heurística. Monod pendiente (T5). | [05](supuestos/05-fermenta-viva.md) |
| 06 abasto-vivo | **C** | Colas de flota AMR razonables, pero todo es criterio propio. En standby. | [06](supuestos/06-abasto-vivo.md) |
| 07 obra-viva | **B** | El mejor referenciado: cada umbral cita norma (DIN, Res., NSR-10, ISO). Falta histórico de obra. | [07](supuestos/07-obra-viva.md) |
| 09 solar-edificio | **B** | Validado contra PVGIS con error publicado (+40 %), pero sin SPA/Perez: recurso solar heurístico. | [09](supuestos/09-solar-edificio.md) |
| 10 canal-alerta | **B** | Lluvia real de IDEAM (T3); modelo de embalses defendible, sin validar contra desborde real. | [10](supuestos/10-canal-alerta.md) |

Cada gemelo tiene además un **caso de estudio** (el por qué del proyecto, qué modela y
qué tan real es) en [docs/casos/](casos/).

## Camino a A (qué falta a cada B)

- **05** → implementar cinética de Monod (T5) sobre la estructura ISA-88 ya montada.
- **07** → un histórico real de sensores de obra para validar los umbrales normativos.
- **09** → implementar NREL SPA + transposición de Perez (diferidos en T1); ya tiene la validación.
- **10** → ground-truth de un desborde real (IDIGER) para contrastar la anticipación.
- **01, 02, 04** → validación contra medición (serie histórica, o el experimento de cajas de 04).

## Criterio que cumplen los 8

Ningún umbral de decisión queda sin procedencia en el código: cada uno cita su fuente
o lleva un `// TODO: fuente` explícito. El detalle por variable está en cada hoja de
supuestos.
