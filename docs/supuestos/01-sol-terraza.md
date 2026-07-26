# Supuestos — 01 SOL-TERRAZA · Nivel B

Modelo heurístico de un cultivo hidropónico de terraza. Los umbrales son coherentes
con guías de hidroponía de hoja pero sin cita puntual verificada.

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| Temp. alerta / reset | 28 / 27 °C | // TODO: fuente (quema foliar en hoja) | Específico de hortaliza de hoja; otras especies varían. |
| pH mínimo / reset | 5,5 / 5,9 | Rango hidroponía de hoja ~5,5–6,5. // TODO: fuente | Fuera de hoja no aplica. |
| CE rango | 1,5–2,0 mS/cm | CE típico de hoja. // TODO: fuente | Cultivo de fruto pide CE mayor. |
| Nivel mín. depósito | 20 % | Criterio operativo propio. // TODO: fuente | Depende del tamaño del tanque real. |
| SoC ahorro | 30 % | Criterio de gestión de batería propio. // TODO: fuente | Depende de la química y autonomía objetivo. |
| Irradiancia carga / LED | 150 / 130 W/m² | Criterio propio. // TODO: fuente | Calibrar contra el panel real. |

**Camino a A:** validar el modelo contra una serie histórica real del cultivo (no solo
ingesta en vivo), o contra un ensayo controlado.
