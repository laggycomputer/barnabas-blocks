#define update_hz 2  // How many times to broadcast pins per second
#include <limits.h>

const int pins[20] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, A0, A1, A2, A3, A4, A5};
void setup() {
  for (int pin = 0; pin < 20; pin++) {
    pinMode(pins[pin], INPUT);
  }
  Serial.begin(19200);
}

void loop() {
  unsigned long running_state = 0;
  for (int pin_chunk = 0; pin_chunk < 10; pin_chunk++) {
    for (int pin_index = 2 * pin_chunk; pin_index < (pin_chunk + 1) * 2; pin_index++) {
      running_state += analogRead(pins[pin_index]) << (((pin_index + 1) % 2) * 10);
    }
    Serial.print(running_state);
    Serial.print(" ");
  }
  Serial.print("\n");
  delay(1000 / update_hz);
}
