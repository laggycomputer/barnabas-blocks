#include <limits.h>
#include <Servo.h>

#define SERIAL_POLL_RATE 75
// note: NUM_DIGITAL_PINS is actually the number of all pins

// 0 is input to Ardiuno, 1 is output from Arduino, 2 is servo control
int pin_modes[NUM_DIGITAL_PINS] = {0};
int io_outputs[NUM_DIGITAL_PINS] = {0};

Servo servos[NUM_DIGITAL_PINS];

String incomingStuff = "";

void setup() {
    pin_modes[1] = 1;
    for (int pin = 0; pin < NUM_DIGITAL_PINS; pin++) {
        if (pin != 1) {
            pinMode(pin, INPUT);
        }
    }

    Serial.begin(19200);
    Serial.setTimeout(SERIAL_POLL_RATE);
}

void enforceState() {
    for (int i = 0; i < NUM_DIGITAL_PINS; i++) {
        switch (pin_modes[i]) {
            case 0:
                if (servos[i].attached()) {
                    servos[i].detach();
                }
                pinMode(i, INPUT);
                // enforce pullup state
                // digitalWrite(i, io_outputs[i]);

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
        for (int pin = 0; pin < NUM_DIGITAL_PINS; pin++) {
            if (pin_modes[pin] == 0) {
                Serial.print(digitalRead(pin));
            } else {
                Serial.print("?");
            }
        }

        Serial.print("\n");
    } else if (incomingStuff.equals("AI")) {
        Serial.print("AI: ");
        for (int pin = analogInputToDigitalPin(0); pin <= analogInputToDigitalPin(NUM_ANALOG_INPUTS - 1); pin++) {
            Serial.print(analogRead(pin));
            Serial.print(" ");
        }
        Serial.print("\n");
    } else if (incomingStuff.equals("PINMODES")) {
        Serial.print("PINMODES: ");
        for (int pin = 0; pin < NUM_DIGITAL_PINS; pin++) {
            Serial.print(pin_modes[pin]);
        }
        Serial.print("\n");
    } else if (incomingStuff.startsWith("PINMODES=")) {
        String arg = incomingStuff.substring(9);
        for (unsigned int ind = 0; ind < arg.length(); ind++) {
            char working_char = arg.charAt(ind);
            // analog pin or pin 1/2
            // assume analog pins are mapped together
            if (ind < 2 || (ind >= analogInputToDigitalPin(0) && ind <= analogInputToDigitalPin(NUM_ANALOG_INPUTS - 1))) {
                continue;
            }

            switch (working_char) {
                case '0':
                    pin_modes[ind] = 0;
                    break;
                case '1':
                    pin_modes[ind] = 1;
                    break;
                case '2':
                    if (digitalPinHasPWM(ind)) {
                        pin_modes[ind] = 2;
                    } else {
                        // not PWM, meh
                    }
            }
        }
        Serial.println("OK");
    } else if (incomingStuff.equals("DO")) {
        Serial.print("DO: ");
        for (int pin = 0; pin < NUM_DIGITAL_PINS; pin++) {
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
        for (unsigned int ind = 0; ind < arg.length(); ind++) {
            working_char = arg.charAt(ind);
            // allow setting in input mode (pullup) or output mode (voltage)
            if (ind < 2 || ind > 13 || (working_char != '0' && working_char != '1')) {
                continue;
            }
            io_outputs[ind] = working_char - '0';
        }
        Serial.println("OK");
    } else if (incomingStuff.equals("SERVO")) {
        Serial.print("SERVO: ");
        for (int pin = 0; pin < NUM_DIGITAL_PINS; pin++) {
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

        for (int pin = 0; pin < NUM_DIGITAL_PINS; pin++) {
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
