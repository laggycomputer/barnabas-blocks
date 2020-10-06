#define pin LED_BUILTIN

void setup() {
  Serial.begin(9600);
  Serial.setTimeout(500);
  pinMode(pin, OUTPUT);
}

void loop() {
  long time = Serial.parseInt();
  digitalWrite(pin, HIGH);
  delay(time);
  digitalWrite(pin, LOW);
  delay(time);
}