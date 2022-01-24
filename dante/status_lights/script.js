"use strict"

/* global AvrgirlArduino, TextEncoderStream, TextDecoderStream, TransformStream, Uint8Array */

const arduinoSideCode = `
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
    incomingStuff = Serial.readStringUntil('\\n');

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

        Serial.print("\\n");
    } else if (incomingStuff.equals("AI")) {
        Serial.print("AI: ");
        for (int pin = 19; pin > 14; pin--) {
            Serial.print(analogRead(pin));
            Serial.print(" ");
        }
        Serial.print(analogRead(14));
        Serial.print("\\n");
    } else if (incomingStuff.equals("PINMODES")) {
        Serial.print("PINMODES: ");
        for (int pin = 19; pin >= 0; pin--) {
            Serial.print(pin_modes[pin]);
        }
        Serial.print("\\n");
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
        Serial.print("\\n");
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

        Serial.print("\\n");
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

            for (int ind = 0; thisPinAngle[ind] != '\\0'; ind++) {
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
`

// IIFE for GC
;(() => {
    const addlPinInfo = {
        0: "Serial RX", 1: "Serial TX", 13: "Built-in LED",
        14: "A0", 15: "A1", 16: "A2", 17: "A3", 18: "A4", 19: "A5"
    }

    const PWMPins = [3, 5, 6, 9, 10, 11]

    const pins = Array.from(new Array(20)).map((_e, i) => i)
    const pinTooltips = pins.map(pinNum => `Pin ${pinNum}${PWMPins.includes(pinNum) ? "~" : ""}${addlPinInfo[pinNum] ? " (" + addlPinInfo[pinNum] + ")" : ""}`)

    const modesGrid = document.getElementById("modesGrid")
    const inputStatesGrid = document.getElementById("inputStatesGrid")
    const digitalOutputsGrid = document.getElementById("digitalOutputsGrid")

    for (const pinNum in pins) {
        let img = new Image(32)
        img.src = "assets/unknown.svg"
        img.title = pinTooltips[pinNum]
        img.id = `state${pinNum}`
        img.onclick = () => toggleState(pinNum)
        modesGrid.appendChild(img)

        img = new Image(32)
        img.src = "assets/unknown.svg"
        img.title = pinTooltips[pinNum]
        img.id = `input${pinNum}`
        inputStatesGrid.appendChild(img)

        img = new Image(32)
        img.src = "assets/unknown.svg"
        img.title = pinTooltips[pinNum]
        img.id = `output${pinNum}`
        img.onclick = () => toggleDigitalOutput(pinNum)
        digitalOutputsGrid.appendChild(img)

        if (pinNum > 0 && pinNum % 5 == 4) {
            modesGrid.appendChild(document.createElement("br"))
            inputStatesGrid.appendChild(document.createElement("br"))
            digitalOutputsGrid.appendChild(document.createElement("br"))
        }
    }
})()


let port
let reader
let inputDone
let outputDone
let inputStream
let outputStream
let latestDataDirs
let latestDOState
let autoRefreshIntervalID

const butConnect = document.getElementById("butConnect")
const butRefresh = document.getElementById("butRefresh")


document.addEventListener("DOMContentLoaded", () => {
    butConnect.addEventListener("click", clickConnect)
    butRefresh.addEventListener("click", clickRefresh)

    const notSupported = document.getElementById("notSupported")
    notSupported.classList.toggle("hidden", "serial" in navigator)
})

function clickRefresh() {
    if (port) {
        writeToStream("DO\n")
        writeToStream("DI\n")
        writeToStream("AI\n")
        writeToStream("PINMODES\n")
    }
}

async function updatePinMode(pin, modeTo) {
    if (port && latestPinModes != undefined) {
        let newPinModes = latestPinModes.split("")
        // hope this is valid?
        newPinModes[pin] = modeTo.toString()
        writeToStream(`PINMODES=${newPinModes.join("")}\n`)
        clickRefresh()
    }
}

// Bound to an onclick which eslint cannot detect
// eslint-disable-next-line no-unused-vars
async function toggleDigitalOutput(pin) {
    if (port && latestDOState != undefined) {
        let newDOState = latestDOState.split("")
        switch (latestDOState[pin]) {
        case "1":
            newDOState[pin] = "0"
            break
        case "0":
            newDOState[pin] = "1"
            break
        case "?":
            toggleState(pin)
            newDOState[pin] = "1"
            break
        }
        writeToStream(`DO=${newDOState.join("")}\n`)
        clickRefresh()
    }
}


/**
 * @name connect
 * Opens a Web Serial connection to a micro:bit and sets up the input and
 * output stream.
 */
async function connect() {
    // CODELAB: Add code to request & open port here.
    // - Request a port and open a connection.
    port = await navigator.serial.requestPort()
    // - Wait for the port to open.
    await port.open({ baudRate: 19200 })
    // CODELAB: Add code setup the output stream here.
    const encoder = new TextEncoderStream()
    outputDone = encoder.readable.pipeTo(port.writable)
    outputStream = encoder.writable
    // CODELAB: Add code to read the stream here.
    let decoder = new TextDecoderStream()
    inputStream = decoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
    inputDone = port.readable.pipeTo(decoder.writable)
    reader = inputStream.getReader()
    readLoop()
    // The codelab wants us to decode via JSON as well, though that isn't needed here
    // .pipeThrough(new TransformStream(new JSONTransformer()));
}

/**
 * @name disconnect
 * Closes the Web Serial connection.
 */
async function disconnect() {
    // CODELAB: Close the input stream (reader).
    if (reader) {
        await reader.cancel()
        await inputDone.catch(() => { })
        reader = null
        inputDone = null
    }
    // CODELAB: Close the output stream.
    if (outputStream) {
        await outputStream.getWriter().close()
        await outputDone
        outputStream = null
        outputDone = null
    }
    // CODELAB: Close the port.
    await port.close()
    port = null
}

var str2ab = function (str) {
    // var encodedString = unescape(encodeURIComponent(str));
    var encodedString = str
    var bytes = new Uint8Array(encodedString.length)
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i)
    }
    return bytes.buffer
}

// bound to onclick
// eslint-disable-next-line no-unused-vars
function flashCode(nano = false, code = "", options = {}) {
    const boardForAPI = nano ? "arduino:avr:nano:cpu=atmega328" : "arduino:avr:uno"
    const boardToUpload = nano ? "nano" : "uno"
    options.baudRate = nano ? 57600 : 115200

    code = code == "" ? arduinoSideCode : code

    var data = { sketch: code, board: boardForAPI }

    if (port) {
        disconnect()
        toggleUIConnected(false)
    }
    // CODELAB: Add connect code here.

    fetch("https://compile.barnabasrobotics.com/compile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(data => {
        console.log(data)
        if (!data.success) {
            // can only run below if arduino compile error I can still get response with garbage body
            if (data.stderr.length > 0) {
                let regex = /\/tmp\/chromeduino-(.*?)\/chromeduino-(.*?)\.ino:/g
                let message = data.stderr.replace(regex, "")
                alert("Compilation error:\n" + message + "\n")
                regex = /\d+:\d+/g
            }
        } else {
            let hexstring = atob(data.hex)
            return { "data": hexstring, "msg": data.stdout }
        }
    }).then(hex => {
        if (hex) {
            try {
                var avrgirl = new AvrgirlArduino({
                    board: boardToUpload,
                    debug: true
                })

                avrgirl.flash(str2ab(hex.data), (error) => {
                    // gear.classList.remove('spinning');
                    // progress.textContent = "done!";
                    if (error) {
                        alert("Upload error:\n" + error + "\n")
                        avrgirl.connection.serialPort.close()
                    } else {
                        alert("Upload successful.\n")
                    }
                }, options)
            } catch (error) {
                alert("AVR error:\n" + error + "\n")
                avrgirl.connection.serialPort.close()
            }
        }
    })
}

/**
 * @name clickConnect
 * Click handler for the connect/disconnect button.
 */
async function clickConnect() {
    // CODELAB: Add disconnect code here.
    if (port) {
        await disconnect()
        toggleUIConnected(false)
        return
    }
    // CODELAB: Add connect code here.
    await connect()

    toggleUIConnected(true)
}


/**
 * @name readLoop
 * Reads data from the input stream and displays it on screen.
 */
async function readLoop() {
    // CODELAB: Add read loop here.

    // eslint be quiet
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { value, done } = await reader.read()

        console.log("[RECEIVED] " + value)

        if (value.trim() == "OK") {
            continue
        } else if (value.startsWith("DI: ")) {
            let outputs = value.trim().slice(4)
            outputs.split("").forEach((state, index) => {
                let elem = document.getElementById("input" + index)
                let newImageSource
                if (state == "?") {
                    newImageSource = "assets/unknown.svg"
                } else {
                    state = parseInt(state)
                    if (state) {
                        newImageSource = "assets/on.svg"
                    } else {
                        newImageSource = "assets/off.svg"
                    }
                }
                elem.src = newImageSource
            })
        } else if (value.startsWith("AI: ")) {
            let outputs = value.trim().slice(4)
            outputs.split(" ").forEach((state, index) => {
                let elem = document.getElementById("A" + index)
                elem.textContent = state.toString()
                elem = document.getElementById("A" + index + "V")
                elem.textContent = (Math.round((state / 1023 * 5) * 100) / 100).toString()
            })
        } else if (value.startsWith("PINMODES: ")) {
            let outputs = value.trim().slice(10)
            latestPinModes = outputs
            outputs.split("").forEach((state, index) => {
                let elem = document.getElementById("state" + index)
                let newImageSource
                if (state == "?") {
                    newImageSource = "assets/unknown.svg"
                }
                elem.src = `assets/${PIN_MODE_REGISTRY[parseInt(state)].img}`
            })
        } else if (value.startsWith("DO: ")) {
            let outputs = value.trim().slice(4)
            latestDOState = outputs

            outputs.split("").forEach((state, index) => {
                let elem = document.getElementById("output" + index)
                let newImageSource
                if (state == "?") {
                    newImageSource = "assets/unknown.svg"
                } else {
                    state = parseInt(state)
                    if (state) {
                        newImageSource = "assets/outputhigh.png"
                    } else {
                        newImageSource = "assets/outputlow.png"
                    }
                }
                elem.src = newImageSource
            })
        } else {
            // nothing to do or supposedly invalid message
            continue
        }

        if (done) {
            console.log("[readLoop] DONE", done)
            reader.releaseLock()
            break
        }
    }
}

/**
 * @name writeToStream
 * Gets a writer from the output stream and send the lines to the micro:bit.
 * @param  {...string} lines lines to send to the micro:bit
 */
function writeToStream(...lines) {
    // CODELAB: Write to output stream
    const writer = outputStream.getWriter()
    lines.forEach((line) => {
        console.log("[SEND]", line)
        writer.write(line) // Allow user to specify which line ending
    })
    writer.releaseLock()
}

/**
 * @name LineBreakTransformer
 * TransformStream to parse the stream into lines.
 */
class LineBreakTransformer {
    constructor() {
        // A container for holding stream data until a new line.
        this.container = ""
    }

    transform(chunk, controller) {
        // CODELAB: Handle incoming chunk
        this.container += chunk
        const lines = this.container.split("\n")
        this.container = lines.pop()
        lines.forEach(line => controller.enqueue(line))
    }

    flush(controller) {
        // CODELAB: Flush the stream.
        controller.enqueue(this.container)
    }
}

/**
 * The code below is mostly UI code and is provided to simplify the codelab.
 */

function toggleUIConnected(connected) {
    let lbl = "Connect"
    if (connected) {
        lbl = "Disconnect"
    }
    butConnect.textContent = lbl
}

// bound to onclick
// eslint-disable-next-line no-unused-vars
function handleAutoRefreshChange() {
    const isNowChecked = document.getElementById("butAutoRefresh").checked

    // if we want this on, it was previously off and we need an interval (clear the old one just in case)
    // if we want this off, we need an interval
    // therefore unconditionally clear
    if (autoRefreshIntervalID !== undefined) {
        clearInterval(autoRefreshIntervalID)
    }

    if (isNowChecked) {
        autoRefreshIntervalID = window.setInterval(clickRefresh, 500)
    }
}

autoRefreshIntervalID = window.setInterval(clickRefresh, 500)
