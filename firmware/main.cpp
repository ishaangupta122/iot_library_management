#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

#include "secrets.h"

// ======================================
// SENSOR CONFIGURATION
// ======================================

constexpr uint8_t SENSOR_COUNT = 3;

const uint8_t irPins[SENSOR_COUNT] = {22, 23, 15};

const uint8_t buttonPins[SENSOR_COUNT] = {25, 33, 32};

const char* irPaths[SENSOR_COUNT] = {
  "/sensors/ir1",
  "/sensors/ir2",
  "/sensors/ir3"
};

constexpr uint8_t IR_ACTIVE_LEVEL = LOW;

// ======================================
// TIMING
// ======================================

constexpr uint32_t IR_DEBOUNCE_MS = 3000;
constexpr uint32_t BUTTON_DEBOUNCE_MS = 50;
constexpr uint32_t BUTTON_HOLD_MS = 3000;
constexpr uint32_t OVERRIDE_MS = 60000;
constexpr uint32_t WIFI_RETRY_MS = 5000;
constexpr uint32_t WRITE_GAP_MS = 250;

// ======================================
// FIREBASE OBJECTS
// ======================================

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool firebaseConfigured = false;

// ======================================
// SENSOR VARIABLES
// ======================================

int rawSensor[SENSOR_COUNT] = {-1, -1, -1};
int stableSensor[SENSOR_COUNT] = {-1, -1, -1};

uint32_t sensorChangedAt[SENSOR_COUNT] = {0, 0, 0};

// ======================================
// BUTTON VARIABLES
// EXTERNAL PULL-DOWN LOGIC
// LOW  = RELEASED
// HIGH = PRESSED
// ======================================

bool lastButtonReading[SENSOR_COUNT] = {LOW, LOW, LOW};
bool buttonState[SENSOR_COUNT] = {LOW, LOW, LOW};

uint32_t buttonChangedAt[SENSOR_COUNT] = {0, 0, 0};
uint32_t buttonPressedAt[SENSOR_COUNT] = {0, 0, 0};

bool buttonTriggered[SENSOR_COUNT] = {false, false, false};

// ======================================
// OVERRIDE VARIABLES
// ======================================

bool overrideActive[SENSOR_COUNT] = {false, false, false};

uint32_t overrideStartedAt[SENSOR_COUNT] = {0, 0, 0};

// ======================================
// FIREBASE UPLOAD VARIABLES
// ======================================

int desiredValue[SENSOR_COUNT] = {-1, -1, -1};
int sentValue[SENSOR_COUNT] = {-99, -99, -99};

uint32_t lastWiFiAttemptAt = 0;
uint32_t lastWriteAt = 0;

uint8_t nextSensorToWrite = 0;

// ======================================
// WIFI CONNECTION
// ======================================

void beginWiFi() {

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");

  uint32_t startedAt = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - startedAt < 15000) {

    delay(250);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("\nWi-Fi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

  } else {

    Serial.println("\nWi-Fi not connected yet; will retry");
  }
}

// ======================================
// FIREBASE INITIALIZATION
// ======================================

void configureFirebaseAndSignIn() {

  if (firebaseConfigured ||
      WiFi.status() != WL_CONNECTED) {
    return;
  }

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Serial.println("Starting Firebase authentication...");

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  firebaseConfigured = true;

  Serial.println("Firebase initialized");
}

// ======================================
// BUTTON DETECTION
// PULL-DOWN: HIGH = PRESSED
// ======================================

void updateButtons() {

  uint32_t now = millis();

  for (uint8_t i = 0; i < SENSOR_COUNT; i++) {

    bool reading = digitalRead(buttonPins[i]);

    // Detect raw button changes

    if (reading != lastButtonReading[i]) {

      lastButtonReading[i] = reading;
      buttonChangedAt[i] = now;
    }

    // Button debounce

    if (now - buttonChangedAt[i] >= BUTTON_DEBOUNCE_MS &&
        reading != buttonState[i]) {

      buttonState[i] = reading;

      // Button PRESSED = HIGH

      if (buttonState[i] == HIGH) {

        buttonPressedAt[i] = now;
        buttonTriggered[i] = false;

        Serial.printf("Button %u pressed\n", i + 1);
      }

      // Button RELEASED = LOW

      else {

        Serial.printf("Button %u released\n", i + 1);
      }
    }

    // Activate after continuous 3-second HIGH

    if (buttonState[i] == HIGH &&
        !buttonTriggered[i] &&
        now - buttonPressedAt[i] >= BUTTON_HOLD_MS) {

      buttonTriggered[i] = true;

      overrideActive[i] = true;
      overrideStartedAt[i] = now;

      desiredValue[i] = 2;

      Serial.printf(
        "Seat %u override activated: 60 seconds\n",
        i + 1
      );
    }
  }
}

// ======================================
// IR SENSOR DETECTION
// ======================================

void updateSensors() {

  uint32_t now = millis();

  for (uint8_t i = 0; i < SENSOR_COUNT; i++) {

    int reading =
      (digitalRead(irPins[i]) == IR_ACTIVE_LEVEL) ? 1 : 0;

    if (reading != rawSensor[i]) {

      rawSensor[i] = reading;
      sensorChangedAt[i] = now;
    }

    // Three-second stability debounce

    if (rawSensor[i] != stableSensor[i] &&
        now - sensorChangedAt[i] >= IR_DEBOUNCE_MS) {

      stableSensor[i] = rawSensor[i];

      Serial.printf(
        "Seat %u stable IR = %d\n",
        i + 1,
        stableSensor[i]
      );
    }

    // Override expiration

    if (overrideActive[i]) {

      if (now - overrideStartedAt[i] >= OVERRIDE_MS) {

        overrideActive[i] = false;

        Serial.printf(
          "Seat %u override expired\n",
          i + 1
        );

        if (stableSensor[i] >= 0) {

          desiredValue[i] = stableSensor[i];

          Serial.printf(
            "Seat %u restored to IR value %d\n",
            i + 1,
            stableSensor[i]
          );
        }
      }

      if (overrideActive[i]) {
        continue;
      }
    }

    // Normal IR operation

    if (stableSensor[i] >= 0) {
      desiredValue[i] = stableSensor[i];
    }
  }
}

// ======================================
// FIREBASE UPLOAD
// ======================================

void uploadPendingValue() {

  if (!firebaseConfigured || !Firebase.ready()) {
    return;
  }

  uint32_t now = millis();

  if (now - lastWriteAt < WRITE_GAP_MS) {
    return;
  }

  for (uint8_t offset = 0; offset < SENSOR_COUNT; offset++) {

    uint8_t i = (nextSensorToWrite + offset) % SENSOR_COUNT;

    int value = desiredValue[i];

    if (value < 0 || value == sentValue[i]) {
      continue;
    }

    lastWriteAt = now;

    if (Firebase.RTDB.setInt(&fbdo, irPaths[i], value)) {

      Serial.printf(
        "Uploaded %s = %d\n",
        irPaths[i],
        value
      );

      if (desiredValue[i] == value) {
        sentValue[i] = value;
      }

    } else {

      Serial.printf(
        "Write failed for %s: %s\n",
        irPaths[i],
        fbdo.errorReason().c_str()
      );
    }

    nextSensorToWrite = (i + 1) % SENSOR_COUNT;

    return;
  }
}

// ======================================
// SETUP
// ======================================

void setup() {

  Serial.begin(115200);
  delay(300);

  for (uint8_t i = 0; i < SENSOR_COUNT; i++) {

    pinMode(irPins[i], INPUT);

    // External pull-down resistor is being used
    pinMode(buttonPins[i], INPUT);
  }

  beginWiFi();

  configureFirebaseAndSignIn();

  Serial.println("================================");
  Serial.println("SMARTLIB STARTED");
  Serial.println("IR debounce: 3 seconds");
  Serial.println("Button logic: HIGH = PRESSED");
  Serial.println("Button hold: 3 seconds");
  Serial.println("Override: 60 seconds");
  Serial.println("================================");
}

// ======================================
// MAIN LOOP
// ======================================

void loop() {

  updateButtons();
  updateSensors();

  uint32_t now = millis();

  if (WiFi.status() != WL_CONNECTED &&
      now - lastWiFiAttemptAt >= WIFI_RETRY_MS) {

    lastWiFiAttemptAt = now;

    Serial.println("Wi-Fi disconnected; reconnecting");

    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  if (WiFi.status() == WL_CONNECTED &&
      !firebaseConfigured) {

    configureFirebaseAndSignIn();
  }

  uploadPendingValue();

  delay(5);
}
\