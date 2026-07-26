# Supuestos — 05 FERMENTA-VIVA · Nivel B

Fermentación de precisión (proteína sin animal). La **estructura por fases sigue
ISA-88 (IEC 61512)**, un estándar real implementado; la cinética del cultivo es
heurística (relajación a setpoints). La cinética publicada (Monod) es trabajo futuro
: por eso hoy es B, no A.

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| Orden de fases | Inoc→Crec→Prod→Cosecha→CIP | ISA-88 / IEC 61512 (estructura) | La estructura es real; la dinámica no. |
| Duración de fases | 8/25/30/9/12 | Valores de proceso plausibles. // TODO: fuente | No calibrado contra lote real. |
| Setpoints (OD, título, DO₂, pH, T) | ver `BIO_TGT` | Valores de proceso plausibles. // TODO: fuente | No medidos. |
| L leche eq. / (g/L título) | 42 | Equivalencia ilustrativa. // TODO: fuente | Solo comunica impacto, no es dato. |
| L leche / vaca / año | 7500 | Promedio lechero. // TODO: fuente (Fedegán/USDA) | Varía por raza y manejo. |
| Prob. contaminación (Producción) | 1/140 por dt | Criterio propio. // TODO: fuente | Ilustrativo. |
| OD buen crecimiento | 6 (OD600) | Criterio propio. // TODO: fuente | Depende del organismo. |

**Camino a A:** reemplazar la relajación a setpoints por **cinética de Monod** (μ = μmax·S/(Ks+S))
con parámetros de literatura, y validar la curva de crecimiento contra datos publicados.
