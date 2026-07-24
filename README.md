# Portafolio Solarpunk: 8 gemelos digitales

SPA de React 19 + Vite 8 + Three.js que presenta 8 gemelos digitales en vivo, cada
uno con su simulador, su escena 3D y su panel de datos. La tesis del portafolio es
la honestidad tecnica verificable: sin hype, sin numeros inventados, y con una
etiqueta que dice de un vistazo que tan real es cada gemelo.

- Produccion: https://portafolio-solarpunk.vercel.app
- Repo: https://github.com/camelojd/portafolio-solarpunk

## Los 8 gemelos

Cada gemelo lleva una etiqueta de fidelidad (ver mas abajo). Los archivados 03
(fibra-via) y 08 (ciclo-obra) se descartaron y viven en ramas aparte.

| ID | Gemelo | Fidelidad | Que es |
|----|--------|:---------:|--------|
| 01 | sol-terraza | B | Hidroponia urbana en terraza; puede alimentarse con sensores reales por MQTT. |
| 02 | aqua-serve | B | Datacenter de IA enfriado por liquido; eje = balance hidrico pluvial. |
| 04 | refugio-vivo | B | Refugios para animales rescatados; confort termico por material del techo. |
| 05 | fermenta-viva | B | Fermentacion de precision (proteina sin vaca) con maquina de estados ISA-88. |
| 06 | abasto-vivo | C | Flota de robots AMR en un banco de alimentos, con priorizacion FEFO. |
| 07 | obra-viva | B | Monitoreo de obra (vibracion, ruido, polvo, talud, calor) con umbrales de norma. |
| 09 | solar-edificio | B | Balance generacion menos consumo de un edificio FV; validado contra PVGIS. |
| 10 | canal-alerta | B | Drenaje urbano y alerta temprana; alimentado con lluvia real de IDEAM. |

## Etiquetas de fidelidad

Cada gemelo muestra un badge "Modelo A/B/C" con enlace a su hoja de supuestos.

- A: modelo con fisica publicada (algoritmo de literatura implementado) y validado
  contra medicion. Requiere las dos mitades.
- B: modelo empirico calibrado (parametros de fuentes reales) o fisica simplificada
  defendible, sin validacion completa.
- C: heuristica ilustrativa, con fines educativos o de demostracion.

Hoy ninguno es A: preferimos decirlo a inflar la etiqueta. El detalle y el camino a A
de cada uno estan en `docs/fidelidad.md` y en `docs/supuestos/`.

## Que se ha hecho (T1 a T4)

**T1. Validacion de solar-edificio (09) contra datos reales.** Se descargo el ano
meteorologico tipico (TMY) real de Bogota de PVGIS y se escribio un arnes de
validacion. Hallazgo publicado: el modelo sobreestima la generacion anual en +40 %
(hasta +54 % en meses lluviosos), porque su nubosidad aleatoria no captura la
bimodalidad de lluvias de Bogota. Se agrego un toggle "irradiancia sintetica / TMY
real" sin romper el contrato de datos, y se corrigio la tarjeta (se retiraron
afirmaciones de NREL SPA y Perez-Ineichen que el codigo no implementa).

**T2. Ingesta MQTT real en sol-terraza (01).** Cliente mqtt.js sobre WebSocket,
configurable por variables de entorno, con fallback silencioso al simulador si no hay
broker. El simulador consume el dato real y las plantas de la escena reaccionan a la
temperatura medida. La UI declara SIMULADO o DATO REAL con marca de tiempo. Incluye
firmware ESP32 (SHT30 + BH1750) y su documentacion. mqtt.js se carga de forma
diferida para no pesar en el resto del portafolio.

**T3. Rediseno honesto de 02, 04 y 10.**
- 02 aqua-serve: se giro el eje de energia a agua. Las turbinas (180 W, menos del
  0,1 % del consumo) pasaron a detalle anecdotico; el eje es el balance hidrico en
  litros por dia, con demanda calculada por WUE (Water Usage Effectiveness).
- 04 refugio-vivo: se reemplazaron los coeficientes inventados por valores U reales
  de literatura (ISO 6946 + estudios de bambu) y un modelo sol-aire. Resultado:
  techo de acero 37 C vs guadua 27 C al mediodia.
- 10 canal-alerta: la lluvia aleatoria se reemplazo por la serie horaria real de la
  estacion IDEAM de Kennedy (oct-nov 2024). Hallazgo honesto: con lluvia real el
  canal no desborda; el modelo estaba calibrado para tormentas sinteticas mas duras.

**T4. Etiquetas de fidelidad y hojas de supuestos (8 gemelos).** Se clasifico cada
gemelo (A/B/C) contra el codigo real, corrigiendo dos que se proponian como A. Ningun
umbral de decision queda sin procedencia: cada uno cita su fuente o lleva un
`// TODO: fuente` explicito. Se crearon `docs/fidelidad.md` y una hoja de supuestos
por gemelo, y un badge de fidelidad en la UI.

## Arquitectura

```
src/
  sim/            8 simuladores puros (uno por gemelo) + tests en __tests__/
    data/         series reales embebidas (TMY Bogota, lluvia IDEAM Kennedy)
  content/        PROFILE, DOMAINS (los 8 gemelos), RUTA
  scene3d/        escenas Three.js (la escena solo LEE el estado)
  lib/            utilidades, RNG determinista, cliente/parseo MQTT
  styles/         CSS
data/             dato real crudo documentado (TMY de PVGIS)
docs/             validaciones, tesis, fidelidad y hojas de supuestos
  supuestos/      una hoja por gemelo: variable | valor | fuente | limite
public/docs/      copia servida de docs/ (para los enlaces "ver supuestos")
firmware/         sketch ESP32 del nodo real de sol-terraza
scripts/          generadores reproducibles (validacion, series embebidas)
```

### Contrato de datos (invariante)

- `rt.data`: estado del simulador. La escena 3D solo lee.
- `rt.cmds`: banderas de control bidireccional (UI hacia simulador).
- `rt.queue`: eventos discretos.
- `rt.real`: ultima lectura de sensores reales (ingesta MQTT), si esta fresca.
- Ciclo: intervalo de 500 ms, con 1/2/4/8 sub-pasos, dt = 0,5.

## Datos reales usados

- PVGIS v5.2 TMY (irradiancia horaria de Bogota) en `data/` y `src/sim/data/tmyBogota.js`.
- IDEAM via datos.gov.co (lluvia horaria, estacion Kennedy) en `src/sim/data/lluviaKennedy.js`.
- Sensores en vivo (opcionales) por MQTT: SHT30 + BH1750 en el nodo ESP32 de sol-terraza.

## Documentacion

- `docs/fidelidad.md`: tabla de los 8 gemelos, niveles y justificacion.
- `docs/supuestos/NN-<id>.md`: procedencia de cada variable por gemelo.
- `docs/09-validacion.md`: metodo, fuente y error del modelo solar vs PVGIS.
- `docs/10-validacion.md`: lluvia real de IDEAM y hallazgo del canal.
- `docs/02-tesis.md`: tesis del balance hidrico y sensibilidad al WUE.
- `docs/04-termico.md`: modelo sol-aire, valores U y experimento de validacion.
- `docs/01-mqtt.md`: esquema del pipeline sensor a MQTT a modelo a visualizacion.

## Uso

```bash
npm install
npm run dev        # servidor de desarrollo
npm run test       # tests de los simuladores (Vitest)
npm run lint       # Oxlint
npm run build      # build de produccion a dist/
```

Ingesta MQTT (opcional): copiar `.env.example` a `.env.local` y definir
`VITE_MQTT_URL`. Sin esa variable, la app corre en modo simulado.

Reproducir los datos embebidos:

```bash
node scripts/gen-tmy-embed.mjs      # TMY de Bogota (requiere el CSV en data/)
node scripts/gen-lluvia-embed.mjs   # lluvia IDEAM Kennedy
node scripts/validar-solar.mjs      # tabla de validacion solar y grafica
```

## Despliegue

Por Vercel CLI desde la carpeta del proyecto:

```bash
vercel --prod --yes
```

El proyecto ya esta enlazado (`.vercel/`). La produccion queda en
portafolio-solarpunk.vercel.app.

## Hoja de ruta (de B hacia A)

Nada de esto es un bug: los 8 gemelos funcionan. Es el trabajo para subir la
fidelidad de cada uno.

- 09 solar-edificio: implementar NREL SPA (o Grena) + transposicion de Perez.
- 05 fermenta-viva: cinetica de Monod sobre la estructura ISA-88 ya montada.
- 10 canal-alerta: ground-truth de un desborde real (IDIGER) para validar la anticipacion.
- 07 obra-viva: historico real de sensores de obra para cerrar el lazo.
- 04 refugio-vivo: experimento de las dos cajas de 1 m3 con DS18B20.
- 01, 02: validacion contra medicion; y para 02, alimentar con lluvia real.

Ademas quedan afinamientos menores: alinear los chips de `stack` de algunos gemelos a
la implementacion real, y automatizar la copia de `docs/` a `public/docs/`.
