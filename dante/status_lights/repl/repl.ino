#include <limits.h>

#define TIMEOUT_MS 75

// 0 is input to Ardiuno, 1 is output from Arduino
int io_states[20] = {0};
int io_outputs[20] = {0};

String incomingStuff = "";

void setup() {
    for (int pin = 0; pin < 20; pin++) {
        pinMode(pin, INPUT);
    }

    Serial.begin(19200);
    Serial.setTimeout(TIMEOUT_MS);
}

void enforceState() {
    for (int i = 0; i < 14; i++) {
        if (io_states[i]) {
            pinMode(i, INPUT);
            digitalWrite(i, LOW);
        } else {
            pinMode(i, OUTPUT);
            digitalWrite(i, io_outputs[i]);
        }
    }
}

void loop() {
    enforceState();

    incomingStuff = "";
    incomingStuff = Serial.readStringUntil('\n');

    if (incomingStuff == "") {
        return;
    } else if (incomingStuff == "DI") {
        Serial.print("DI: ");
        for (int pin = 19; pin >= 0; pin--) {
            if (!io_states[pin]) {
                Serial.print(digitalRead(pin));
            } else {
                Serial.print("?");
            }
        }

        Serial.print("\n");
    } else if (incomingStuff == "IOSTATE") {
        Serial.print("IOSTATE: ");
        for (int pin = 19; pin >= 0; pin--) {
            Serial.print(io_states[pin]);
        }
        Serial.print("\n");
    } else if (incomingStuff.startsWith("IOSTATE=")) {
        String arg = incomingStuff.substring(8);
        char working_char;
        for (int i = 0; i < arg.length(); i++) {
            working_char = arg.charAt(i);
            int working_pin = 19 - i;
            if (working_pin < 2 || working_pin > 13) {
                continue;
            }
            if (working_char == '0') {
                io_states[working_pin] = 0;
            } else {
                io_states[working_pin] = 1;
            }
        }
        Serial.println("OK");
    } else if (incomingStuff == "DO") {
        Serial.print("DO: ");
        for (int pin = 19; pin >= 0; pin--) {
            if (io_states[pin]) {
                Serial.print(io_outputs[pin]);
            } else {
                Serial.print("?");
            }
        }
        Serial.print("\n");
    } else if (incomingStuff.startsWith("DO=")) {
        String arg = incomingStuff.substring(3);
        char working_char;
        for (int i = 0; i < arg.length(); i++) {
            working_char = arg.charAt(i);
            int working_pin = 19 - i;
            if (working_pin < 2 || working_pin > 13 || !io_states[working_pin]) {
                continue;
            }
            if (working_char == '0') {
                io_outputs[working_pin] = 0;
            } else {
                io_outputs[working_pin] = 1;
            }
        }
        Serial.println("OK");
    }
}
