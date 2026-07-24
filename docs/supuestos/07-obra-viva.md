# Supuestos — 07 OBRA-VIVA · Nivel B

Monitoreo de una obra (vibración, ruido, polvo, talud, calor). Es el gemelo **mejor
referenciado**: cada umbral de alerta sale de normativa citada. El modelo que genera
las señales es heurístico; falta un histórico real de sensores de obra para validar.

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| PPV alerta | 25 mm/s | DIN 4150-3 (vibración en estructuras) | Depende del tipo de edificación vecina. |
| Ruido ocupacional | 85 dB(A) | Res. 1792/1990 (Colombia) | Exposición laboral, no comunitaria. |
| Ruido comunitario día / noche | 65 / 55 dB(A) | Res. 0627/2006 (Colombia) | Por tipo de sector. |
| PM10 alerta (sostenido) | 150 µg/m³ | Res. 2254/2017 (calidad del aire) | Promedios y ventanas específicas. |
| Desplazamiento amarilla / roja | 15 / 25 mm/24h | NSR-10 Título H (geotecnia) | Depende del diseño del talud. |
| WBGT alerta | 30 °C | ISO 7243 (estrés térmico) | Según carga metabólica y aclimatación. |

**Camino a A:** validar los umbrales normativos contra un histórico real de sensores
de una obra (los umbrales ya son de norma; falta la medición que cierre el lazo).
