#include <limits.h>

#define TIMEOUT_MS 75

const int digitals[14] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13};
const int analogs[6] = {A0, A1, A2, A3, A4, A5};  // Really just aliases to 14, 15, 16, 17, 18, and 19 but readability

// 0 is input to Ardiuno, 1 is output from Arduino
int io_states[20] = {0};
int io_outputs[20] = {0};

String incomingStuff = "";

void setup() {
    for (int pin = 0; pin < 14; pin++) {
        pinMode(digitals[pin], INPUT);
    }

    for (int pin = 0; pin < 6; pin++) {
        pinMode(analogs[pin], INPUT);
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
        for (int pin = 0; pin < 20; pin++) {
            if (!io_states[pin]) {
                Serial.print(digitalRead(pin));
            } else {
                Serial.print("?");
            }
        }

        Serial.print("\n");
    } else if (incomingStuff == "IOSTATE") {
        Serial.print("IOSTATE: ");
        for (int i = 0; i < 20; i++) {
            Serial.print(io_states[i]);
        }
        Serial.print("\n");
    } else if (incomingStuff.startsWith("IOSTATE=")) {
        String arg = incomingStuff.substring(8);
        char working_char;
        for (int i = 0; i < arg.length(); i++) {
            working_char = arg.charAt(i);
            if (i < 2 || i > 13) {
                continue;
            }
            if (working_char == '0') {
                io_states[i] = 0;
            } else {
                io_states[i] = 1;
            }
        }
        Serial.println("OK");
    } else if (incomingStuff == "DO") {
        Serial.print("DO: ");
        for (int i = 0; i < 20; i++) {
            if (io_states[i]) {
                Serial.print(io_outputs[i]);
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
            if (i < 2 || i > 13 || !io_states[i]) {
                continue;
            }
            if (working_char == '0') {
                io_outputs[i] = 0;
            } else {
                io_outputs[i] = 1;
            }
        }
        Serial.println("OK");
    }
}
