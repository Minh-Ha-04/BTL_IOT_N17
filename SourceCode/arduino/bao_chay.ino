#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <ArduinoJson.h> // Thư viện xử lý JSON

// --- Cấu hình Mạng & MQTT ---
const char* ssid = "TP-Link_FB50";          
const char* password = "88157214";  
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;

const char* clientID = "ESP32FireAlarmClient_123"; 
const char* dataTopic = "fire-alarm/data";
const char* controlTopic = "fire-alarm/control";

WiFiClient espClient;
PubSubClient client(espClient);

// --- Cảm biến và thiết bị ---
#define DHT_PIN 4          
#define MQ2_PIN 32         
#define FLAME_PIN 27       
#define BUZZER_PIN 26      
#define LED_FIRE_PIN 25    
#define BUTTON_PIN 14      
#define LED_STATE_PIN 33   
#define RELAY_FAN_PIN 22   
#define RELAY_PUMP_PIN 23  

#define FLAME_ACTIVE_LOW true
#define DHT_TYPE DHT22

 
#define PUBLISH_INTERVAL 1000 

DHT dht(DHT_PIN, DHT_TYPE);

// --- Biến hệ thống ---
bool alarmEnabled = true;   // Bật/tắt cảnh báo vật lý
int lastReading = HIGH;
int stableState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;
unsigned long lastPublishTime = 0;
float tempThreshold = 45.0; // Nhiệt độ (mặc định)
int mq2Threshold = 1000;    // MQ2 (mặc định)
// --- Khai báo hàm ---
void reconnect();
void callback(char* topic, byte* payload, unsigned int length);
void ambulanceSiren();
void handleButton();
void publishSensorData(float temp, int mq2, bool flame, bool alarm);

// ================= SETUP ===================
void setup() {
  Serial.begin(115200);
  delay(20);

  // --- PinMode ---
  pinMode(FLAME_PIN, INPUT);
  pinMode(LED_FIRE_PIN, OUTPUT);
  pinMode(LED_STATE_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_FAN_PIN, OUTPUT);
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // --- Trạng thái mặc định ---
  digitalWrite(RELAY_FAN_PIN, LOW);   // Tắt quạt lúc khởi động
  digitalWrite(RELAY_PUMP_PIN, LOW);  // Tắt bơm lúc khởi động
  digitalWrite(LED_FIRE_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_STATE_PIN, HIGH);

  dht.begin();

  // --- Kết nối WiFi & MQTT ---
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected.");

  client.setServer(mqttServer, mqttPort); 
  client.setCallback(callback); 
  reconnect();

  Serial.println("Fire alarm system started...");
}

// ================= LOOP ===================
void loop() {
  if (!client.connected()) reconnect();
  client.loop(); 

  handleButton(); // xử lý nút bấm vật lý

  // LED trạng thái phản ánh cảnh báo vật lý
  digitalWrite(LED_STATE_PIN, alarmEnabled ? HIGH : LOW);

  // --- Đọc cảm biến ---
  int flameValue = digitalRead(FLAME_PIN);
  bool flameDetected = (FLAME_ACTIVE_LOW ? (flameValue == LOW) : (flameValue == HIGH));

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int mq2Value = analogRead(MQ2_PIN);

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Error reading DHT11!");
    delay(1000);
    return;
  }

  // --- Kiểm tra báo cháy ---
  bool alarm = flameDetected || (temperature >= tempThreshold) || (mq2Value >= mq2Threshold);

  if (alarm && alarmEnabled) {
    ambulanceSiren();
    digitalWrite(RELAY_FAN_PIN, HIGH);   // Bật quạt
    digitalWrite(RELAY_PUMP_PIN, HIGH);  // Bật bơm
  } else {
    noTone(BUZZER_PIN);
    digitalWrite(LED_FIRE_PIN, LOW);
    digitalWrite(RELAY_FAN_PIN, LOW);    // Tắt quạt
    digitalWrite(RELAY_PUMP_PIN, LOW);   // Tắt bơm
  }

  // --- Gửi dữ liệu MQTT ---
  if (millis() - lastPublishTime > PUBLISH_INTERVAL) {
    publishSensorData(temperature, mq2Value, flameDetected, alarm);
    lastPublishTime = millis();
  }

  delay(100);
}

// ================= HÀM HỖ TRỢ ===================
void ambulanceSiren() {
  for (int freq = 700; freq <= 1400; freq += 10) {
    tone(BUZZER_PIN, freq);
    digitalWrite(LED_FIRE_PIN, HIGH);
    delay(2);
  }
  for (int freq = 1400; freq >= 700; freq -= 10) {
    tone(BUZZER_PIN, freq);
    digitalWrite(LED_FIRE_PIN, LOW);
    delay(2);
  }
}

// --- Xử lý nút bấm vật lý (chỉ bật/tắt cảnh báo) ---
void handleButton() {
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastReading) lastDebounceTime = millis();

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != stableState) {
      stableState = reading;
      if (stableState == LOW) {
        alarmEnabled = !alarmEnabled; // Toggle cảnh báo
        Serial.print("Alarm enabled: ");
        Serial.println(alarmEnabled ? "ON" : "OFF");
      }
    }
  }
  lastReading = reading;
}

// --- Kết nối lại MQTT ---
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(clientID)) {
      Serial.println("Connected!");
      client.subscribe(controlTopic); 
      Serial.print("Subscribed to: ");
      Serial.println(controlTopic);
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// --- Gửi dữ liệu MQTT ---
void publishSensorData(float temp, int mq2, bool flame, bool alarm) {
  if (!client.connected()) return;

  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["mq2Value"] = mq2;
  doc["flameDetected"] = flame;
  doc["alarm"]=alarm;
  doc["alarmEnabled"] = alarmEnabled;
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);

  client.publish(dataTopic, jsonBuffer);
  Serial.print("Published: ");
  Serial.println(jsonBuffer);
}

// --- Xử lý lệnh MQTT từ server ---
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Received control message on [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String message = "";
  for (int i = 0; i < length; i++) message += (char)payload[i];
  Serial.println(message);

  StaticJsonDocument<64> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  const char* command = doc["command"];
  bool value = doc["value"]; 

  // --- Lệnh DUY NHẤT: Điều khiển bật/tắt cảnh báo vật lý ---
  if (strcmp(command, "setAlarmEnabled") == 0) {
    alarmEnabled = value; // Gán giá trị true/false từ payload cho biến hệ thống
    
    Serial.print("Command: SET ALARM ENABLED to ");
    Serial.println(alarmEnabled ? "TRUE" : "FALSE");
  }
  else if (strcmp(command, "setTemperatureThreshold") == 0) {
    float value = doc["value"];
    tempThreshold = value;
    Serial.print("Command: SET TEMPERATURE THRESHOLD to ");
    Serial.println(tempThreshold);
  }
  else if (strcmp(command, "setMq2Threshold") == 0) {
    int value = doc["value"];
    mq2Threshold = value;
    Serial.print("Command: SET MQ2 THRESHOLD to ");
    Serial.println(mq2Threshold);
  }
}
