#define update_hz 5  // How many times to broadcast pins per second
#include <limits.h>

const int digitals[14] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13};
const int analogs[6] = {A0, A1, A2, A3, A4, A5};

void setup() {
  for (int pin = 0; pin < 14; pin++) {
    pinMode(digitals[pin], INPUT);
  }

  for (int pin = 0; pin < 6; pin++) {
    pinMode(analogs[pin], INPUT);
  }
  Serial.begin(19200);
}

void loop() {
  for (int digital = 0; digital < 14; digital++) {
    Serial.print(digitalRead(digitals[digital]));
    Serial.print(" ");
  }

  for (int analog = 0; analog < 6; analog++) {
    Serial.print(analogRead(analogs[analog]));
    Serial.print(" ");
  }

  Serial.print("\n");
  delay(1000 / update_hz);
}
