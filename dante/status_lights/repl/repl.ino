#include <limits.h>

#define SERIAL_POLL_RATE 75

// 0 is input to Ardiuno, 1 is output from Arduino, 2 is servo control
int io_states[20] = {0};
int io_outputs[20] = {0};

String incomingStuff = "";

void setup() {
    for (int pin = 0; pin < 20; pin++) {
        pinMode(pin, INPUT);
    }

    Serial.begin(19200);
    Serial.setTimeout(SERIAL_POLL_RATE);
}

void enforceState() {
    for (int i = 0; i < 14; i++) {
        switch (io_states[i]) {
            case 0:
                pinMode(i, INPUT);
                digitalWrite(i, LOW);
                break;
            case 1:
                pinMode(i, OUTPUT);
                digitalWrite(i, io_outputs[i]);
                break;
            case 2:
                // nop for now
                break;
        }
    }
}

void loop() {
    enforceState();

    incomingStuff = "";
    incomingStuff = Serial.readStringUntil('\n');

    if (incomingStuff == "") {
        return;
    } else if (incomingStuff == "HELP") {
        Serial.println("DI, AI, DATADIR, DATADIR=, DO, DO=");
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
    } else if (incomingStuff == "AI") {
        Serial.print("AI: ");
        for (int pin = 19; pin > 14; pin--) {
            Serial.print(analogRead(pin));
            Serial.print(" ");
        }
        Serial.print(analogRead(14));
        Serial.print("\n");
    } else if (incomingStuff == "DATADIR") {
        Serial.print("DATADIR: ");
        for (int pin = 19; pin >= 0; pin--) {
            Serial.print(io_states[pin]);
        }
        Serial.print("\n");
    } else if (incomingStuff.startsWith("DATADIR=")) {
        String arg = incomingStuff.substring(8);
        char working_char;
        for (unsigned int i = 0; i < arg.length(); i++) {
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
        for (unsigned int i = 0; i < arg.length(); i++) {
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
