# Supuestos — 10 CANAL-ALERTA · Nivel B

Cadena de drenaje urbano (lluvia → sumideros → SUDS/humedal → canal → alerta).
Alimentado con lluvia real de IDEAM (estación Kennedy). El modelo de embalses es
defendible pero no está validado contra un desborde real.

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| Lluvia de entrada | serie horaria real | IDEAM, INEM Kennedy (2120000122), oct–nov 2024 | Un periodo, una estación; sin evento extremo. |
| Despeje de sumideros | 55 % | Criterio operativo (cuadrilla EAAB). // TODO: fuente | Ilustrativo. |
| Capacidad humedal + SUDS | 5200 m³ | SUDS ref. NS-166 EAAB. // TODO: fuente puntual | Depende del humedal real. |
| Alerta amarilla / naranja / roja | 68 / 85 / 96 % | Criterio propio (cf. IDIGER). // TODO: fuente | Umbrales de demostración. |
| Encharcamiento (lluvia / sumid.) | 22 mm/h / 62 % | Criterio propio. // TODO: fuente | Ilustrativo. |
| Drenaje del canal | 1,0 (tasa fija) | Calibrado para el aguacero sintético | **Subestima eventos reales cortos e intensos**. |

**Camino a A:** ground-truth de un desborde real (registros IDIGER) y un sensor de nivel
vivo, para validar la anticipación contra la hora real del agua en la calle.
