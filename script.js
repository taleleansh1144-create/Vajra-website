#include <Arduino.h>
#include <NimBLEDevice.h>

// =====================================================
// UART
// =====================================================

#define UART_TX_PIN 6
#define UART_RX_PIN 7
#define UART_BAUD   115200

HardwareSerial FlightSerial(1);

// =====================================================
// BLE
// =====================================================

#define DEVICE_NAME "ANSH'S DRONE VAJRA"

#define SERVICE_UUID \
  "12345678-1234-1234-1234-1234567890ab"

#define RX_UUID \
  "12345678-1234-1234-1234-1234567890ac"

#define TX_UUID \
  "12345678-1234-1234-1234-1234567890ad"

NimBLECharacteristic *txCharacteristic = nullptr;


// =====================================================
// BLE RX
// =====================================================

class RXCallbacks :
  public NimBLECharacteristicCallbacks
{
public:

  void onWrite(
    NimBLECharacteristic *characteristic,
    NimBLEConnInfo &connInfo
  ) override
  {
    std::string value =
        characteristic->getValue();

    if (value.empty())
      return;

    String command =
        String(value.c_str());

    command.trim();

    if (command.length() == 0)
      return;

    Serial.print("BLE RX: ");
    Serial.println(command);

    // Forward immediately to Flight
    FlightSerial.println(command);

    Serial.print("UART TX: ");
    Serial.println(command);
  }
};


// =====================================================
// SEND FLIGHT RESPONSE TO WEBSITE
// =====================================================

void sendToWebsite(
  const String &message
)
{
  if (!txCharacteristic)
    return;

  txCharacteristic->setValue(
    message.c_str()
  );

  txCharacteristic->notify();
}


// =====================================================
// SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);

  delay(500);

  // UART
  FlightSerial.begin(
    UART_BAUD,
    SERIAL_8N1,
    UART_RX_PIN,
    UART_TX_PIN
  );

  FlightSerial.setTimeout(5);

  Serial.println();
  Serial.println("================================");
  Serial.println("VAJRA MAIN CONTROLLER");
  Serial.println("================================");

  // BLE
  NimBLEDevice::init(
    DEVICE_NAME
  );

  NimBLEServer *server =
    NimBLEDevice::createServer();

  NimBLEService *service =
    server->createService(
      SERVICE_UUID
    );

  // Website -> Main
  NimBLECharacteristic *rxCharacteristic =
    service->createCharacteristic(
      RX_UUID,
      NIMBLE_PROPERTY::WRITE |
      NIMBLE_PROPERTY::WRITE_NR
    );

  rxCharacteristic->setCallbacks(
    new RXCallbacks()
  );

  // Main -> Website
  txCharacteristic =
    service->createCharacteristic(
      TX_UUID,
      NIMBLE_PROPERTY::READ |
      NIMBLE_PROPERTY::NOTIFY
    );

  txCharacteristic->setValue(
    "VAJRA READY"
  );

  service->start();

  // BLE advertising
  NimBLEAdvertising *advertising =
    NimBLEDevice::getAdvertising();

  advertising->addServiceUUID(
    SERVICE_UUID
  );

  advertising->setName(
    DEVICE_NAME
  );

  advertising->start();

  Serial.println();
  Serial.println("BLE ADVERTISING STARTED");
  Serial.print("DEVICE NAME: ");
  Serial.println(DEVICE_NAME);
  Serial.println("BLE + UART ONLY");
  Serial.println("NO MOTOR COMMAND ON BLE CONNECT");
  Serial.println("READY");
}


// =====================================================
// LOOP
// =====================================================

void loop()
{
  while (FlightSerial.available())
  {
    String response =
        FlightSerial.readStringUntil('\n');

    response.trim();

    if (response.length() > 0)
    {
      Serial.print("FLIGHT RX: ");
      Serial.println(response);

      sendToWebsite(response);
    }
  }

  delay(1);
}
