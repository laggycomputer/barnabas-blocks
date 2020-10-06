#define update_hz 20  // How many times to broadcast pins per second

const int pins[20] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, A0, A1, A2, A3, A4, A5};

void setup() {
  for (int pin = 0; pin < 20; pin++) {
    pinMode(pins[pin], INPUT);
  }
  Serial.begin(9600);
}

void loop() {
   unsigned long out = 0;
   for (int pin = 0; pin < 20; pin++) {
     out += digitalRead(pins[pin]) << pin;
   }
   Serial.println(out);
   delay(1000 / update_hz);
}
