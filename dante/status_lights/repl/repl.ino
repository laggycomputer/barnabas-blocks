#include <limits.h>

const int digitals[14] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13};
const int analogs[6] = {A0, A1, A2, A3, A4, A5};  // Really just aliases to 14, 15, 16, 17, 18, and 19 but readability

// 0 is input to Ardiuno, 1 is output from Arduino
// Despite the fact that we want 0 to always be input and 1 and 13 to always be output, leave the array at the same size for consistency
// analogWrite only works on analog and PWM pins, so let's use digital for now
int digital_io_states[14] = {0};
int analog_io_states[6] = {0};

char incomingByte = 0;
String incomingStuff = "";
int stuff_dump = -1;
int new_state = -1;
int pin_to_change = -1;

void setup() {
    for (int pin = 0; pin < 14; pin++) {
        pinMode(digitals[pin], INPUT);
    }

    for (int pin = 0; pin < 6; pin++) {
        pinMode(analogs[pin], INPUT);
    }
    Serial.begin(19200);
    Serial.setTimeout(5000);
}

void sendUpdate() {
    for (int digital = 0; digital < 14; digital++) {
        if (!digital_io_states[digital]) {
            Serial.print(digitalRead(digitals[digital]));
        } else {
            Serial.print("?");
        }
        Serial.print(" ");
    }

    for (int analog = 0; analog < 6; analog++) {
        if (!analog_io_states[analog]) {
            Serial.print(analogRead(analogs[analog]));
            Serial.print(" ");
        }
    }

    Serial.print("\n");
}

void loop() {
    if (Serial.available() > 0) {
        incomingByte = Serial.read();
        if (incomingByte == 13 || incomingByte == 10) {
            // Discard CR/LF
            return;
        }

        switch (incomingByte) {
            case 'g':
                sendUpdate();
                break;
            case 'u':
                incomingStuff = Serial.readStringUntil('\n');
                stuff_dump = incomingStuff.toInt();
                if (stuff_dump > 100) {
                    new_state = 1;
                    pin_to_change = stuff_dump - 100;
                } else {
                    new_state = 0;
                    pin_to_change = stuff_dump;
                }
                if (pin_to_change < 0 || pin_to_change > 19) {
                    return;
                }
                if (pin_to_change == 0 || pin_to_change == 1 || pin_to_change == 13) {  // Also invalid
                    return;
                }
                pinMode(pin_to_change, new_state);
                if (pin_to_change <= 13) {
                    // This is a digital, update to digital state array.
                    digital_io_states[pin_to_change] = new_state;
                } else {
                    analog_io_states[pin_to_change - 14] = new_state;
                }
                break;
            default:
                break;
        }
    }
}
