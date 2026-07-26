# Supuestos — 09 SOLAR-EDIFICIO · Nivel B

Balance generación − consumo de un edificio FV en Bogotá. El recurso solar es un
sinusoide simplificado (no NREL SPA ni Perez-Ineichen); el modelo fotovoltaico sí es
física de literatura. Puede alimentarse con irradiancia real de Bogotá (PVGIS). Por eso
es B, no A.

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| Potencia FV nominal | 12,5 kWp | Supuesto de instalación | Escala la generación. |
| Coef. de temperatura | −0,35 %/°C | Típico de c-Si (datasheet) | Otras tecnologías difieren. |
| Otras pérdidas | 0,975 | Cableado + inversor + suciedad (estimación) | // TODO: desglose por fuente. |
| Temp. de celda | NOCT, +26 °C a 1 sol | Modelo NOCT estándar | Aproxima; no es térmica detallada. |
| Recurso solar | sinusoide sin(π(h−6)/12) | **Heurístico, no SPA/Perez** | Sin geometría solar real; sin estacionalidad. |
| Irradiancia (modo real) | TMY horario PVGIS | PVGIS v5.2, Bogotá | TMY típico, no un año concreto. |
| Interior alerta | 27 °C | Confort. // TODO: fuente | Depende del uso del edificio. |
| SoC alerta | 20 % | Criterio propio. // TODO: fuente | Según autonomía objetivo (4 h). |
| ACH vent / base | 4,6 / 0,6 | Rango tipo NTC 6083 | Residencial vs. oficina. |

**Camino a A:** implementar NREL SPA (o Grena) + transposición de Perez.
