# Supuestos — 04 REFUGIO-VIVO · Nivel B

Modelo térmico sol-aire en régimen permanente con **valores U reales de literatura**.
Modelo, fuentes y experimento de validación en [docs/04-termico.md](../04-termico.md).

| Variable | Valor | Fuente | Límite de validez |
|----------|-------|--------|-------------------|
| U guadua (techo) | 0,9 W/m²K | Muro multicapa bambú U≈0,67 (3 capas); λ compuesto 0,12–0,17 W/mK. **// TODO: fuente techo-específica** | Estimación de techo a partir de muros. |
| U acero (chapa) | 6,0 W/m²K | ISO 6946: dominan Rsi 0,10 + Rse 0,04 (acero no aísla) | Chapa desnuda; con aislante cambia. |
| h_o (película ext.) | 25 W/m²K | ISO 6946, Rse = 0,04 | Estándar. |
| U_g (envolvente) | 2,5 W/m²K | Supuesto (muros + ventilación) | No medido; acotar con el experimento. |
| q_int (animales) | 10 W/m² | Supuesto | No medido; acotar con el experimento. |
| Albedo guadua / acero | 0,5 / 0,35 | Valores típicos. // TODO: fuente | Depende del acabado. |
| Costo acero / guadua | 18,4 / 12,8 M COP | Precio de mercado estimado. // TODO: fuente | Volátil; requiere cotización. |
| Cronograma | 4 / 5 semanas | Estimación propia. // TODO: fuente | Depende de cuadrilla y clima. |

**Camino a A:** correr el experimento de las dos cajas de 1 m³ con DS18B20 y ajustar
`U_g`/`q_int` al dato medido.
