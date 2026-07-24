# CANAL-ALERTA (10): validación con lluvia real

## Qué cambió

La lluvia de entrada dejó de ser aleatoria (`R() < 0.0022 ? rnd(4,9)`) y ahora es una
**serie horaria real** de un pluviómetro de Bogotá. El botón de aguacero se mantiene
como override sintético (celda de 40 mm/h) para demostrar el caso extremo a demanda.

## Fuente

- **IDEAM**, estación **INEM Francisco de Paula Santander (Kennedy)**, código
  **2120000122** (automática con telemetría), en el corazón de la zona que el gemelo
  modela (Kennedy/Bosa).
- Dataset **"Precipitación"** de datos.gov.co (`s54a-sgyg`), API Socrata.
- Periodo: **2024-10-01 a 2024-11-30** (temporada de lluvias), agregado a **horario**
  (mm/h) en el servidor con `date_extract_*`. Los huecos de la estación se tratan como
  0 (sin lluvia).
- Serie embebida: [src/sim/data/lluviaKennedy.js](../src/sim/data/lluviaKennedy.js)
  (1464 h). Regenerable con `node scripts/gen-lluvia-embed.mjs`.

Consulta de descarga (agregado horario):

```
https://www.datos.gov.co/resource/s54a-sgyg.json
  ?$select=date_extract_y(fechaobservacion) as y, date_extract_m(fechaobservacion) as m,
           date_extract_d(fechaobservacion) as d, date_extract_hh(fechaobservacion) as h,
           sum(valorobservado) as mm
  &$where=codigoestacion='2120000122'
          AND fechaobservacion between '2024-10-01T00:00:00' and '2024-12-01T00:00:00'
  &$group=y,m,d,h &$order=y,m,d,h &$limit=2000
```

## La serie real

- Acumulado: **284,5 mm** en dos meses.
- Pico horario: **20,2 mm/h** (2-nov-2024, 13 h).
- Las horas más intensas caen entre las 13 y 15 h: el **patrón convectivo vespertino**
  clásico de la sabana de Bogotá, que el aleatorio anterior no reproducía.

| Fecha (2024) | Hora | mm/h |
|--------------|------|-----:|
| 2 nov | 13 h | 20,2 |
| 19 nov | 00 h | 15,6 |
| 2 nov | 14 h | 14,6 |
| 27 nov | 14 h | 11,8 |
| 14 nov | 15 h | 10,4 |
| 11 nov | 13 h | 9,4 |

## Comparación: anticipación del modelo vs. desborde

Corriendo el modelo sobre toda la serie real (reproducible, sin comando de aguacero):

| Métrica | Resultado |
|---------|-----------|
| Lluvia máx. vista por el modelo | 15,2 mm/h |
| Nivel máx. del canal | **27 %** (Verde) |
| Alertas disparadas | **0** |
| Desbordes | **0** |

**El canal nunca cruza a alerta con la lluvia real de este periodo.** Esto no es un
fallo: es el hallazgo de la validación, y tiene dos lecturas honestas:

1. **La ventana no tuvo un evento extremo.** El pico real fue 20,2 mm/h durante una
   hora; los aguaceros que desbordan canales en Kennedy suelen ser más intensos y,
   sobre todo, coincidir con sumideros ya tapados. Oct–nov 2024, en esta estación, no
   trajo ese evento.
2. **Expone una calibración.** La hidráulica del modelo (entrada por sumideros, drenaje
   fijo) estaba ajustada para que el aguacero **sintético de 40 mm/h sostenido** (el
   botón) desbordara. La lluvia real es más corta e intermitente: 20 mm/h durante una
   o dos horas no alcanza a llenar el canal al ritmo modelado. El modelo no llora lobo
   con lluvia normal, que es una propiedad deseable, pero también sugiere que la
   sensibilidad a eventos reales cortos e intensos podría estar subestimada.

## Dónde el modelo deja de ser válido (y qué falta)

- **No hay comparación contra un desborde real** porque en la ventana elegida no
  ocurrió uno registrado. Validar de verdad la anticipación exige (a) una serie que
  incluya un evento extremo documentado y (b) el **dato de campo del desborde**
  (registros de IDIGER / bitácora distrital) para contrastar la hora de alerta del
  modelo con la hora real del agua en la calle. `// TODO: conseguir ground-truth de un desborde real en Kennedy y su fecha.`
- El **nivel del canal no está medido**: el modelo lo integra a partir de la lluvia,
  no lo lee de un sensor. Cerrar ese lazo es el paso P2 del proyecto.
- Los huecos de la estación se rellenan con 0; algunos podrían ser cortes del sensor,
  no horas secas.

## Conclusión honesta

El gemelo pasó de "lluvia inventada" a "lluvia real de IDEAM", con su firma temporal
correcta (tormentas vespertinas). Al hacerlo, aprendió algo que solo se aprende
probando contra la realidad: **su cadena hidráulica está calibrada para tormentas más
duras y sostenidas que las que trajo esta temporada real.** Ese es exactamente el tipo
de hallazgo que justifica validar contra datos, y queda documentado en vez de
escondido.
