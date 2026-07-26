# Portafolio Solarpunk: 8 gemelos digitales

SPA de React 19 + Vite + Three.js que presenta 8 gemelos digitales en vivo, cada uno
con su simulador, su escena 3D y su panel de datos. Todo es simulacion. La tesis del
portafolio es la honestidad tecnica verificable: sin hype, sin numeros inventados, y
con una etiqueta que dice de un vistazo que tan real es cada gemelo.

- Produccion: https://portafolio-solarpunk.vercel.app
- Repo: https://github.com/camelojd/portafolio-solarpunk

## Los 8 gemelos

Cada gemelo lleva una etiqueta de fidelidad (ver mas abajo).

| ID | Gemelo | Fidelidad | Que es |
|----|--------|:---------:|--------|
| 01 | sol-terraza | B | Hidroponia urbana en terraza: temperatura, pH, CE, nivel y bateria. |
| 02 | aqua-serve | B | Datacenter de IA enfriado por liquido; eje = balance hidrico pluvial. |
| 04 | refugio-vivo | B | Refugios para animales rescatados; confort termico por material del techo. |
| 05 | fermenta-viva | B | Fermentacion de precision (proteina sin vaca) con maquina de estados ISA-88. |
| 06 | abasto-vivo | C | Flota de robots AMR en un banco de alimentos, con priorizacion FEFO. |
| 07 | obra-viva | B | Monitoreo de obra (vibracion, ruido, polvo, talud, calor) con umbrales de norma. |
| 09 | solar-edificio | B | Balance generacion menos consumo de un edificio FV; puede usar irradiancia real de PVGIS. |
| 10 | canal-alerta | B | Drenaje urbano y alerta temprana; alimentado con lluvia real de IDEAM. |

## Etiquetas de fidelidad

Cada gemelo muestra un badge "Modelo A/B/C" con enlace a su hoja de supuestos y a su
caso de estudio.

- A: modelo con fisica publicada (algoritmo de literatura implementado) y validado contra medicion.
- B: modelo empirico calibrado (parametros de fuentes reales) o fisica simplificada defendible, sin validacion completa.
- C: heuristica ilustrativa, con fines educativos o de demostracion.

Hoy ninguno es A: preferimos decirlo a inflar la etiqueta. El detalle y el camino a A
de cada uno estan en `docs/fidelidad.md`.

## Arquitectura

```
src/
  sim/            8 simuladores puros (uno por gemelo) + tests en __tests__/
    data/         series reales embebidas (TMY Bogota de PVGIS, lluvia IDEAM Kennedy)
  content/        PROFILE, DOMAINS (los 8 gemelos), RUTA
  scene3d/        escenas Three.js (la escena solo LEE el estado)
  lib/            utilidades y RNG determinista
  styles/         CSS
data/             dato real crudo documentado (TMY de PVGIS)
docs/             fidelidad, hojas de supuestos y casos de estudio
public/docs/      copia servida de docs/ (para los enlaces del panel)
scripts/          generadores reproducibles de las series embebidas
```

### Contrato de datos (invariante)

- `rt.data`: estado del simulador. La escena 3D solo lee.
- `rt.cmds`: banderas de control bidireccional (UI hacia simulador).
- `rt.queue`: eventos discretos.
- Ciclo: intervalo de 500 ms, con 1/2/4/8 sub-pasos, dt = 0,5.

## Datos reales embebidos

Dos gemelos alimentan su simulacion con datos historicos reales de Bogota:

- PVGIS v5.2 TMY (irradiancia horaria) en `src/sim/data/tmyBogota.js` (solar-edificio).
- IDEAM via datos.gov.co (lluvia horaria, estacion Kennedy) en `src/sim/data/lluviaKennedy.js` (canal-alerta).

## Documentacion

- `docs/fidelidad.md`: tabla de los 8 gemelos, niveles y justificacion.
- `docs/supuestos/NN-<id>.md`: procedencia de cada variable por gemelo.
- `docs/casos/NN-<id>.md`: el porque de cada gemelo, que modela y que tan real es.

## Uso

```bash
npm install
npm run dev        # servidor de desarrollo
npm run test       # tests de los simuladores (Vitest)
npm run lint       # Oxlint
npm run build      # build de produccion a dist/
```

Regenerar las series embebidas:

```bash
node scripts/gen-tmy-embed.mjs      # TMY de Bogota (requiere el CSV en data/)
node scripts/gen-lluvia-embed.mjs   # lluvia IDEAM Kennedy
```

## Despliegue

Por Vercel CLI desde la carpeta del proyecto:

```bash
vercel --prod --yes
```

El proyecto ya esta enlazado (`.vercel/`). La copia de `docs/` a `public/docs/` se
automatiza en el hook `prebuild`.

## Hoja de ruta

Posible trabajo futuro para subir la fidelidad de cada gemelo:

- 09 solar-edificio: posicion solar con NREL SPA (o Grena) + transposicion de Perez.
- 05 fermenta-viva: cinetica de Monod sobre la estructura ISA-88 ya montada.
- 10 canal-alerta: ground-truth de un desborde real (IDIGER) para validar la anticipacion.
- 07 obra-viva: historico real de sensores de obra.
- 04 refugio-vivo: experimento de dos cajas de 1 m3 con DS18B20.
- 01, 02: validacion contra medicion.
