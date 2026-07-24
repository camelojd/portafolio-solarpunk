# Escenas 3D low poly solarpunk

Los 10 gemelos digitales del portafolio, en un estilo low poly consistente: flat shading, geometría facetada, colores vivos y luz cálida. Todo corre en Three.js sobre React y está pensado para volar en móvil.

## Cómo está organizado

```
src/scene3d/
  palette.js        Paleta maestra + materiales compartidos + semáforo de estado
  core.js           Mundo compartido: luces con hora del día, cielo, terreno,
                    árboles, cerros, lluvia, auto, humano, instanciado, sombras
  index.js          Mapa id_de_proyecto -> builder de escena
  scenes/
    refugio.js      REFUGIO VIVO DT  (pieza de referencia de estilo)
    fermenta.js     FERMENTA VIVA DT
    sol.js          SOL-TERRAZA DT
    canal.js        CANAL-ALERTA DT
    abasto.js       ABASTO VIVO DT
    solaredificio.js SOLAR-EDIFICIO DT
    obra.js         OBRA-VIVA DT
    aqua.js         AQUA SERVE DT
    fibra.js        FIBRA-VIA DT
    ciclo.js        CICLO-OBRA DT
```

`App.jsx` importa `SCENE_BUILDERS` desde `index.js` y lo mezcla en su objeto `BUILDERS`. El hub y la ruta de 5 años siguen en `App.jsx` porque no son parte de los 10 gemelos.

## Reglas de estilo (las mismas en las 10)

1. **Flat shading obligatorio.** Todos los materiales se crean con `flatShading: true` desde `palette.js` (`mat`, `umat`, `vmat`). No se usa ningún otro material.
2. **Cero texturas de imagen.** El color va en el material o en vertex colors. Nada de albedo/normal/roughness maps ni UV unwrapping.
3. **Material base:** `MeshLambertMaterial`. Barato y suficiente para low poly.
4. **Paleta cerrada:** todo sale de `PAL` y `SEM` en `palette.js`. Si un color no está ahí, no entra.
5. **Instanciado:** todo lo repetido (árboles, cajas, casas, ladrillos, plantas, paneles) usa `InstancedMesh` vía `scatter()` o instancias propias.
6. **Sombras solo en objetos principales.** Lo marcado con `userData.noShadow = true` no proyecta sombra. `enableShadows(root)` aplica la regla al final de cada escena.

## Cómo se firma el look solarpunk

- `makeWorld(scene, root, opts)` monta cielo de gradiente (shader de dos colores), `HemisphereLight` + sol direccional con sombras 1024 + `AmbientLight`, y devuelve `setHour(hora, clima)`.
- `setHour(hora, clima)` mueve el sol en un arco real a latitud Bogotá y cambia el color del cielo, del sol y de la niebla: amanecer cálido, mediodía blanco, atardecer naranja, noche azul. `clima` de 0 (despejado) a 1 (tormenta) apaga el cielo.

## Cómo mapear un dato MQTT a color o animación

Cada escena expone `update(dt, t)` y lee su estado desde `rt.data`, que es exactamente el objeto que hoy produce el simulador y mañana produce MQTT. El contrato es: **el simulador (o el broker) escribe `rt.data`, la escena solo lee.**

Para conectar un sensor real, publica en `rt.data` las mismas claves que ya usa la escena. Ejemplos:

| Proyecto (id)      | Clave en `rt.data` | Qué pinta en la escena |
|--------------------|--------------------|------------------------|
| `cobot` (refugio)  | `refugios[i].dentro`, `.tint`, `.tmin`, `.tmax` | color del techo: verde en rango, amarillo cerca, rojo fuera |
| `cobot`            | `hora` (0–24)      | posición y color del sol |
| `cobot`            | `techo` (`"guadua"`/`"contenedor"`) | color de la banda del refugio |
| `linea-viva` (fermenta) | `titulo`, `contam`, `fase` | color del líquido (semáforo de viabilidad) y del andón |
| `linea-viva`       | `od`               | velocidad del agitador y de las burbujas |
| `sol-terraza`      | `sev`, `ph`        | salud (color) de las plantas |
| `sol-terraza`      | `soc`, `nivel`, `fog`, `irr` | batería, reservorio, neblina, brillo del panel |
| `canal-alerta`     | `nivel`, `alerta` (0–3) | altura del canal, tinte del barrio, sirena, flecha de evacuación |
| `canal-alerta`     | `sumid`, `lluvia`  | sumideros tapados (rojos), densidad de lluvia |
| `almacen-smart` (abasto) | `amrs[i].{rack,phase,charging,bat,s}` | posición y LED de cada AMR |
| `solar-edificio`   | `fv`, `balance`, `soc`, `irr` | brillo de paneles, flujo de energía, batería, heatmap de fachada |
| `obra-viva`        | `wbgt`             | color del chaleco de la cuadrilla (naranja/amarillo/rojo) |
| `obra-viva`        | `pm10`, `riesgo`, `ppv` | polvo, semáforo de postes, vibración de columnas |
| `aqua-serve`       | `tcpu`, `rpm`, `rain`, `nivel` | color del rack, giro de turbinas, lluvia, tanque |
| `fibra-via`        | `det[]`, `soc`, `lum` | deterioro por segmento, batería, luminarias; `rt.queue` inyecta vehículos |
| `ciclo-obra`       | `recibido`, `resid` | hundimiento de báscula, llenado de contenedores |

### El semáforo de estado

`palette.js` exporta `semaforo(k, out)`, que devuelve un color continuo verde → amarillo → naranja → rojo para `k` en `[0,1]`. Es la forma canónica de traducir "qué tan mal va esto" a color. Los cuatro colores fijos (`C_OK`, `C_AVISO`, `C_ALERTA`, `C_CRITICO`) son los mismos en los 10 proyectos.

### Comandos de vuelta (UI → simulador)

La UI escribe banderas en `rt.cmds` (por ejemplo `rt.cmds.fog = true`) y el simulador las consume. Ese es el nivel 4 de un gemelo: no solo mirar, también actuar. Con MQTT real, el mismo objeto `rt.cmds` se traduce a un publish en el tópico de comando del dispositivo.

## Presupuesto de rendimiento

- Máximo ~50.000 tris por escena.
- `pixelRatio` limitado (1.75) en el renderer.
- Sombras 1024, desactivables por objeto.
- El render loop se pausa cuando el canvas sale de pantalla (`IntersectionObserver`).
- Un material por color, compartido y cacheado (`mat()`), para bajar draw calls.
