/* ============================================================================
   SOL-TERRAZA - Nodo de sensores ESP32
   ----------------------------------------------------------------------------
   Lee temperatura y humedad (SHT30) e iluminancia (BH1750) y las publica por
   MQTT en JSON cada 30 s. Reconecta WiFi y broker de forma automatica.

   Payload publicado en el topico (por defecto "solterraza/sensores"):
     {"temp":24.13,"hum":58.7,"lux":13400.0}
   El navegador convierte lux -> W/m2 y sella la hora de recepcion; el nodo no
   envia timestamp (no tiene reloj de pared).

   Librerias (Gestor de librerias de Arduino):
     - PubSubClient        (Nick O'Leary)
     - Adafruit SHT31      (Adafruit)   -> compatible con SHT30
     - BH1750              (Christopher Laws)
   Placa: cualquier ESP32 (probado en ESP32 DevKit v1).
   ============================================================================ */
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <BH1750.h>

// ---- Configuracion: EDITAR ----
const char*    WIFI_SSID     = "TU_WIFI";
const char*    WIFI_PASS     = "TU_PASSWORD";
const char*    MQTT_HOST     = "192.168.1.100";   // IP del broker Mosquitto
const uint16_t MQTT_PORT     = 1883;              // MQTT sobre TCP (el nodo)
const char*    MQTT_USER     = "";                // opcional (vacio = anonimo)
const char*    MQTT_PASS     = "";
const char*    MQTT_TOPIC    = "solterraza/sensores";
const char*    MQTT_CLIENT   = "sol-terraza-esp32";
const uint32_t PUBLISH_MS    = 30000;             // publicar cada 30 s

// ---- Pines I2C (ESP32 por defecto) ----
#define I2C_SDA 21
#define I2C_SCL 22

Adafruit_SHT31 sht = Adafruit_SHT31();
BH1750 lightMeter;
WiFiClient net;
PubSubClient mqtt(net);
uint32_t lastPub = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " WiFi OK" : " WiFi timeout");
}

void connectMqtt() {
  while (!mqtt.connected()) {
    connectWiFi();
    Serial.print("MQTT... ");
    bool ok = (strlen(MQTT_USER) > 0)
      ? mqtt.connect(MQTT_CLIENT, MQTT_USER, MQTT_PASS)
      : mqtt.connect(MQTT_CLIENT);
    if (ok) { Serial.println("conectado"); return; }
    Serial.print("fallo rc="); Serial.println(mqtt.state());
    delay(2000);
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA, I2C_SCL);
  if (!sht.begin(0x44)) Serial.println("SHT30 no detectado en 0x44");
  if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) Serial.println("BH1750 no detectado en 0x23");
  connectWiFi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  if (millis() - lastPub < PUBLISH_MS) return;
  lastPub = millis();

  float t = sht.readTemperature();   // C
  float h = sht.readHumidity();      // %
  float l = lightMeter.readLightLevel(); // lux
  if (isnan(t) || isnan(h)) { Serial.println("Lectura SHT invalida, se omite"); return; }
  if (l < 0) l = 0;

  char payload[96];
  snprintf(payload, sizeof(payload), "{\"temp\":%.2f,\"hum\":%.1f,\"lux\":%.1f}", t, h, l);
  mqtt.publish(MQTT_TOPIC, payload);
  Serial.println(payload);
}
