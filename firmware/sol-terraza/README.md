# Nodo de sensores SOL-TERRAZA (ESP32)

Nodo mínimo que mide temperatura, humedad e iluminancia y las publica por MQTT
para alimentar el gemelo digital SOL-TERRAZA. Alcance deliberadamente acotado:
solo sensores baratos y estables. Se dejan fuera pH y CE (electrodos que derivan
y necesitan calibración periódica; no aportan a una demo de ingesta honesta).

## Sensores

| Sensor | Mide | Bus | Dirección I2C |
|--------|------|-----|---------------|
| SHT30  | Temperatura aire (°C), humedad relativa (%) | I2C | 0x44 |
| BH1750 | Iluminancia (lux) | I2C | 0x23 |

## Cableado (ESP32 DevKit v1)

Ambos sensores comparten el bus I2C.

| Señal | ESP32 | SHT30 | BH1750 |
|-------|-------|-------|--------|
| 3V3   | 3V3   | VCC   | VCC    |
| GND   | GND   | GND   | GND    |
| SDA   | GPIO 21 | SDA | SDA    |
| SCL   | GPIO 22 | SCL | SCL    |

Notas:
- Ambos módulos suelen traer resistencias pull-up en SDA/SCL; con dos en el mismo
  bus el paralelo baja el valor pero funciona. Si el bus queda inestable, retira
  las pull-up de uno de los módulos.
- BH1750: deja `ADDR` sin conectar (o a GND) para la dirección 0x23.
- Alimenta a 3,3 V, no a 5 V.

## Librerías (Gestor de librerías de Arduino)

- `PubSubClient` (Nick O'Leary)
- `Adafruit SHT31` (Adafruit) — compatible con el SHT30
- `BH1750` (Christopher Laws)

Placa: ESP32 (paquete "esp32" de Espressif). Probado en ESP32 DevKit v1.

## Configuración

Edita el bloque `Configuración: EDITAR` en [esp32-sketch.ino](esp32-sketch.ino):
`WIFI_SSID`, `WIFI_PASS`, `MQTT_HOST` (IP del broker), y si tu broker exige
credenciales, `MQTT_USER` / `MQTT_PASS`. El nodo publica cada 30 s.

## Tópico y payload

- Tópico por defecto: `solterraza/sensores`
- Payload JSON:

```json
{"temp":24.13,"hum":58.7,"lux":13400.0}
```

El nodo **no** envía marca de tiempo: no tiene reloj de pared. El navegador sella
la hora de recepción, que es la que usa para el "hace X s" y el timeout de la UI.
La app convierte `lux` a W/m² con un factor de luz diurna aproximado (ver
[docs/01-mqtt.md](../../docs/01-mqtt.md)).

## Prueba rápida sin nodo

Puedes simular el nodo desde cualquier PC con Mosquitto:

```bash
mosquitto_pub -h 192.168.1.100 -t solterraza/sensores -m '{"temp":31.0,"hum":45,"lux":9000}'
```

Con `temp` sobre 28 °C la UI debe pasar a **DATO REAL** y las plantas del gemelo
deben virar a alerta (calor). El detalle del pipeline está en `docs/01-mqtt.md`.
