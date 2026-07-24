# Supuestos — 06 ABASTO-VIVO · Nivel C

Coordinación de una flota de robots (AMR) en un banco de alimentos, con lógica FEFO.
Gemelo **ilustrativo**: la lógica de colas y ruteo es razonable, pero **no hay robot
real ni cliente**, y todos los umbrales son criterios propios de demostración. En
standby hasta tener cliente confirmado.

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| Batería: recarga / bajo | 96 / 20 % | Criterio propio. // TODO: fuente | Depende de la química real del AMR. |
| Meta de despacho | 150 / 158 rac/h | Criterio propio. // TODO: fuente | Sin medición de throughput real. |
| Backlog alerta / reset | 180 / 120 lotes | Criterio propio. // TODO: fuente | Depende de la operación real. |
| Vencer (FEFO) alerta / reset | 5 / 3 lotes | Lógica FEFO; umbral propio. // TODO: fuente | Ilustrativo. |
| Velocidad AMR (normal / bloqueo) | 0,3 / 0,2 | Criterio propio | Sin cinemática real. |

**Camino a B/A:** un piloto real con un AMR y datos de operación; hoy el valor es
mostrar la lógica de decisión, no reproducir una planta.
