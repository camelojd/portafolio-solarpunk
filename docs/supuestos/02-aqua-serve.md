# Supuestos — 02 AQUA-SERVE · Nivel B

Balance hídrico de un datacenter enfriado por líquido: captación pluvial vs. demanda
de enfriamiento. La física del balance está citada; los umbrales son operativos. La
lluvia que lo alimenta es **sintética** (no real). Tesis y sensibilidad en
[docs/02-tesis.md](../02-tesis.md).

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| Área de captación | 2000 m² | Supuesto (cubierta de nave pequeña) | Escala el balance linealmente. |
| Coef. escorrentía | 0,8 | Método racional, cubierta dura (C≈0,7–0,95) | Otras superficies cambian C. |
| Carga TI nominal | 300 kW | Supuesto (datacenter de borde) | Escala la demanda. |
| WUE | 1,0 L/kWh | The Green Grid; promedio industria ~1,8; mejores <0,2 | Palanca dominante del balance. |
| Precip. Bogotá (cifra anual del doc) | ~1000 mm/año | Climatología IDEAM | Solo para la aritmética anual, no la sim. |
| Temp. alerta CPU/GPU | 80 °C | Throttling típico de GPU (~80–90 °C). // TODO: fuente puntual | Varía por modelo de GPU. |
| Nivel alarma / corte DLC | 20 / 10 % | Criterio operativo. // TODO: fuente | Depende del depósito real. |
| Potencia turbinas | 15–45 W × 4 | Anecdótico (<0,1 % del consumo) | No es fuente de energía. |

**Camino a A:** validar contra el consumo de agua medido de un datacenter real, o
alimentar con lluvia real (como se hizo en 10).
