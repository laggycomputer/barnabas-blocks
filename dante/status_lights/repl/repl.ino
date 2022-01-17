#include <limits.h>
#include <Servo.h>

#define SERIAL_POLL_RATE 75

// 0 is input to Ardiuno, 1 is output from Arduino, 2 is servo control
int pin_modes[20] = {0};
int io_outputs[20] = {0};

Servo servos[20];

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
        switch (pin_modes[i]) {
            case 0:
                if (servos[i].attached()) {
                    servos[i].detach();
                }
                pinMode(i, INPUT);
                digitalWrite(i, LOW);
                break;
            case 1:
                if (servos[i].attached()) {
                    servos[i].detach();
                }
                pinMode(i, OUTPUT);
                digitalWrite(i, io_outputs[i]);
                break;
            case 2:
                if (!servos[i].attached()) {
                    servos[i].attach(i);
                }
                break;
        }
    }
}

void loop() {
    enforceState();

    incomingStuff = "";
    incomingStuff = Serial.readStringUntil('\n');

    if (incomingStuff.equals("")) {
        return;
    } else if (incomingStuff.equals("HELP")) {
        Serial.println("DI, AI, PINMODES, PINMODES=, DO, DO=, SERVO, SERVO=");
    } else if (incomingStuff.equals("DI")) {
        Serial.print("DI: ");
        for (int pin = 19; pin >= 0; pin--) {
            if (pin_modes[pin] == 0) {
                Serial.print(digitalRead(pin));
            } else {
                Serial.print("?");
            }
        }

        Serial.print("\n");
    } else if (incomingStuff.equals("AI")) {
        Serial.print("AI: ");
        for (int pin = 19; pin > 14; pin--) {
            Serial.print(analogRead(pin));
            Serial.print(" ");
        }
        Serial.print(analogRead(14));
        Serial.print("\n");
    } else if (incomingStuff.equals("PINMODES")) {
        Serial.print("PINMODES: ");
        for (int pin = 19; pin >= 0; pin--) {
            Serial.print(pin_modes[pin]);
        }
        Serial.print("\n");
    } else if (incomingStuff.startsWith("PINMODES=")) {
        String arg = incomingStuff.substring(10);
        char working_char;
        for (unsigned int i = 0; i < arg.length(); i++) {
            working_char = arg.charAt(i);
            int working_pin = 19 - i;
            if (working_pin < 2 || working_pin > 13) {
                continue;
            }

            switch (working_char) {
                case '0':
                    pin_modes[working_pin] = 0;
                    break;
                case '1':
                    pin_modes[working_pin] = 1;
                    break;
                case '2':
                    switch (working_pin) {
                        case 3:
                        case 5:
                        case 6:
                        case 9:
                        case 10:
                        case 11:
                            pin_modes[working_pin] = 2;
                            break;
                        default:
                            // this is not a PWM pin, reject!
                            break;
                    }
                    break;
            }
        }
        Serial.println("OK");
    } else if (incomingStuff.equals("DO")) {
        Serial.print("DO: ");
        for (int pin = 19; pin >= 0; pin--) {
            if (pin_modes[pin] == 1) {
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
            if (working_pin < 2 || working_pin > 13 || pin_modes[working_pin] != 1) {
                continue;
            }
            io_outputs[working_pin] = working_char == '1' ? 1 : 0;
        }
        Serial.println("OK");
    } else if (incomingStuff.equals("SERVO")) {
        Serial.print("SERVO: ");
        for (int pin = 19; pin >= 0; pin--) {
            switch (pin_modes[pin]) {
                case 0:
                case 1:
                    Serial.print("?");
                    break;
                case 2:
                    if (servos[pin].attached()) {
                        Serial.print(servos[pin].read());
                    } else {
                        Serial.print("?");
                    }
                    break;
            }
            Serial.print(" ");
        }

        Serial.print("\n");
    } else if (incomingStuff.startsWith("SERVO=")) {
        String arg = incomingStuff.substring(6);
        int currentCutoff = 0;
        bool willBreak = false;

        for (int pin = 19; pin >= 0; pin--) {
            if (willBreak) { break; }

            String currentArgSection = arg.substring(currentCutoff);
            int nextSpaceInd = currentArgSection.indexOf(' ');

            willBreak = nextSpaceInd == -1;

            char thisPinAngle[4];
            currentArgSection.substring(0, currentArgSection.indexOf(' ')).toCharArray(thisPinAngle, sizeof(thisPinAngle) / sizeof(char));

            unsigned int totalAngle = 0;

            for (int ind = 0; thisPinAngle[ind] != '\0'; ind++) {
                if (thisPinAngle[ind] >= '0' && thisPinAngle[ind] <= '9') {
                    totalAngle *= 10;
                    totalAngle += thisPinAngle[ind] - '0';
                }
            }

            if (pin_modes[pin] == 2) {
                servos[pin].write(min(max(totalAngle, 0), 180));
            }

            currentCutoff += nextSpaceInd + 1;
        }

        Serial.println("OK");
    }
}
