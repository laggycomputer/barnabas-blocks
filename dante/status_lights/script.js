"use strict"

/* global AvrgirlArduino, TextEncoderStream, TextDecoderStream, TransformStream */

const arduinoSideCode = `
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
    incomingStuff = Serial.readStringUntil('\\n');

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

        Serial.print("\\n");
    } else if (incomingStuff.equals("AI")) {
        Serial.print("AI: ");
        for (int pin = analogInputToDigitalPin(0); pin <= analogInputToDigitalPin(NUM_ANALOG_INPUTS - 1); pin++) {
            Serial.print(analogRead(pin));
            Serial.print(" ");
        }
        Serial.print("\\n");
    } else if (incomingStuff.equals("PINMODES")) {
        Serial.print("PINMODES: ");
        for (int pin = 0; pin < NUM_DIGITAL_PINS; pin++) {
            Serial.print(pin_modes[pin]);
        }
        Serial.print("\\n");
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
        Serial.print("\\n");
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

        Serial.print("\\n");
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

const PIN_MODE_REGISTRY = [
    { name: "input", img: "input.svg" },
    { name: "output", img: "output.svg" },
    { name: "servo", img: "servo.png" },
];

// IIFE for GC
(() => {
    const addlPinInfo = {
        0: "Serial RX", 1: "Serial TX", 13: "Built-in LED",
        14: "A0", 15: "A1", 16: "A2", 17: "A3", 18: "A4", 19: "A5"
    }

    const PWMPins = [3, 5, 6, 9, 10, 11]

    const pins = Array.from(new Array(20)).map((_e, i) => i)
    const pinTooltips = pins.map(pinNum => `Pin ${pinNum}${PWMPins.includes(pinNum) ? "~" : ""}${addlPinInfo[pinNum] ? " (" + addlPinInfo[pinNum] + ")" : ""}`)

    const setModes = document.getElementById("setModes")
    const inputStatesGrid = document.getElementById("inputStatesGrid")
    const digitalOutputsGrid = document.getElementById("digitalOutputsGrid")
    const setServos = document.getElementById("setServos")

    for (const pinNum of pins) {
        const modeSelectRow = document.createElement("tr")
        const modeSelectCell = document.createElement("td")
        PIN_MODE_REGISTRY.forEach(({ name: mode }, ind) => {
            const button = document.createElement("input")
            button.type = "radio"
            button.name = `setMode${pinNum}`
            button.id = `setMode${pinNum}${mode}`
            button.value = ind.toString()
            button.onclick = () => updatePinMode(pinNum, button.value)

            if (pinNum <= 1 || pinNum > 13) {
                // cannot change this pin's state at all
                button.disabled = true
            } else if (mode == "servo" && !PWMPins.includes(pinNum)) {
                // cannot use servo on this pin!
                button.disabled = true
            }

            const label = document.createElement("label")
            label.for = button.id
            label.innerText = mode
            modeSelectCell.appendChild(button)
            modeSelectCell.appendChild(label)
        })

        const rowLabel = document.createElement("td")
        const rowLabelCode = document.createElement("code")
        rowLabelCode.innerText = pinTooltips[pinNum]
        rowLabel.appendChild(rowLabelCode)
        modeSelectRow.appendChild(rowLabel)
        modeSelectRow.appendChild(modeSelectCell)
        setModes.appendChild(modeSelectRow)

        let img = new Image(32)
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
            inputStatesGrid.appendChild(document.createElement("br"))
            digitalOutputsGrid.appendChild(document.createElement("br"))
        }

        if (PWMPins.includes(pinNum)) {
            const thisRow = document.createElement("tr")
            const rowLabelCell = document.createElement("td")
            rowLabelCell.innerText = pinTooltips[pinNum]
            const rowSliderCell = document.createElement("td")
            const slider = document.createElement("input")
            slider.type = "range"
            slider.min = (0).toString()
            slider.max = (180).toString()
            slider.step = (1).toString()  // technically unneeded, this is default
            slider.onchange = () => updateServoAngle(pinNum)
            slider.disabled = true  // enable when we confirm the pinmode is actually servo mode
            const sliderLabel = document.createElement("label")
            sliderLabel.for = slider.id = `setServoAngle${pinNum}`
            sliderLabel.id = `setServoAngleLabel${pinNum}`

            rowSliderCell.appendChild(slider)
            rowSliderCell.appendChild(sliderLabel)

            thisRow.appendChild(rowLabelCell)
            thisRow.appendChild(rowSliderCell)

            setServos.appendChild(thisRow)
        }
    }
})()


let port
let reader
let inputDone
let outputDone
let inputStream
let outputStream
let latestPinModes
let latestDOState
let latestServoAngles
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
        writeToStream("SERVO\n")
    }
}

function updatePinMode(pin, modeTo) {
    if (port && latestPinModes != undefined) {
        const newPinModes = latestPinModes.split("")
        // hope this is valid?
        newPinModes[pin] = modeTo.toString()
        writeToStream(`PINMODES=${newPinModes.join("")}\n`)
        clickRefresh()
    }
}

// Bound to an onclick which eslint cannot detect
// eslint-disable-next-line no-unused-vars
function toggleDigitalOutput(pin) {
    if (port && latestDOState != undefined) {
        const newDOState = latestDOState.split("")
        switch (latestDOState[pin]) {
        case "1":
            newDOState[pin] = "0"
            break
        case "0":
            newDOState[pin] = "1"
            break
        case "?":
            updatePinMode(pin)
            newDOState[pin] = "1"
            break
        }
        writeToStream(`DO=${newDOState.join("")}\n`)
        clickRefresh()
    }
}

function updateServoAngle(pin) {
    if (port && latestServoAngles != undefined && latestPinModes != undefined) {
        if (latestPinModes[pin] != "2") {
            // someone used the console to change this, this slider is disabled
            return
        } else {
            const newServoAngles = new Array(latestServoAngles)
            newServoAngles[pin] = parseInt(document.getElementById(`setServoAngle${pin}`).value)

            writeToStream(`SERVO=${newServoAngles.join(" ")}\n`)
            clickRefresh()
        }
    }
}

/**
 * @name connect
 * Opens a Web Serial connection and initialize input and output.
 */
async function connect() {
    try {
        port = await navigator.serial.requestPort()
        await port.open({ baudRate: 19200 })
    } catch (err) {
        // probably a locked port or a user hitting "cancel" on the port selection dialog.
        // meh, no issue, just report this back to caller
        return false
    }

    const encoder = new TextEncoderStream()
    outputDone = encoder.readable.pipeTo(port.writable)
    outputStream = encoder.writable

    const decoder = new TextDecoderStream()
    inputStream = decoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
    inputDone = port.readable.pipeTo(decoder.writable)
    reader = inputStream.getReader()
    readLoop()

    return true
}

/**
 * @name disconnect
 * Closes the Web Serial connection.
 */
async function disconnect() {
    if (reader) {
        await reader.cancel()
        await inputDone.catch(() => { })
        reader = null
        inputDone = null
    }

    if (outputStream) {
        await outputStream.getWriter().close()
        await outputDone
        outputStream = null
        outputDone = null
    }

    await port.close()
    port = null
}

function str2ab(str) {
    const bytes = new Uint8Array(str.length)
    for (let i = 0; i < str.length; ++i) {
        bytes[i] = str.charCodeAt(i)
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

    const data = { sketch: code, board: boardForAPI }

    if (port) {
        disconnect()
        toggleUIConnected(false)
    }

    fetch("https://compile.barnabasrobotics.com/compile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            if (!data.success) {
                if (data.stderr.length > 0) {
                    const regex = /\/tmp\/chromeduino-(.*?)\/chromeduino-(.*?)\.ino:/g
                    const message = data.stderr.replace(regex, "")
                    alert(`Compilation error:\n${message}\n`)
                }
            } else {
                return { data: atob(data.hex), msg: data.stdout }
            }
        }).then(hex => {
            if (hex) {
                try {
                    var avrgirl = new AvrgirlArduino({
                        board: boardToUpload,
                        debug: true
                    })

                    avrgirl.flash(str2ab(hex.data), (error) => {
                        if (error) {
                            alert(`Upload error:\n${error}\n`)
                            avrgirl.connection.serialPort.close()
                        } else {
                            alert("Upload successful.\n")
                        }
                    }, options)
                } catch (error) {
                    alert(`AVR error:\n${error}\n`)
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
    if (port) {
        await disconnect()
        toggleUIConnected(false)
        return
    }

    if (await connect()) {
        toggleUIConnected(true)
    }
}


/**
 * @name readLoop
 * Reads data from the input stream and displays it on screen.
 */
async function readLoop() {
    // eslint be quiet
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { value, done } = await reader.read()

        console.log(`[RECEIVED] ${value}`)

        if (value.trim() == "OK") {
            continue
        } else if (value.startsWith("DI: ")) {
            const withoutPrefix = value.trim().slice(4)
            withoutPrefix.split("").forEach((state, index) => {
                const elem = document.getElementById(`input${index}`)
                if (state == "?") {
                    elem.src = "assets/unknown.svg"
                } else {
                    state = parseInt(state)
                    if (state) {
                        elem.src = "assets/on.svg"
                    } else {
                        elem.src = "assets/off.svg"
                    }
                }
            })
        } else if (value.startsWith("AI: ")) {
            const withoutPrefix = value.trim().slice(4)
            withoutPrefix.split(" ").forEach((state, index) => {
                const rawValElem = document.getElementById(`A${index}`)
                rawValElem.textContent = state.toString()
                const voltageElem = document.getElementById(`A${index}V`)
                voltageElem.textContent = (Math.round((state / 1023 * 5) * 100) / 100).toString()
            })
        } else if (value.startsWith("PINMODES: ")) {
            const withoutPrefix = value.trim().slice(10)
            latestPinModes = withoutPrefix
            withoutPrefix.split("").forEach((state, index) => {
                if (state != "?") {
                    Array(...document.getElementsByName(`setMode${index}`)).forEach((elem, ind) => {
                        // if this element governs state x and the pin is also in state x (where x is in PIN_MODE_REGISTRY),
                        // check this button for the user. otherwise, uncheck it.
                        elem.checked = parseInt(state) == ind
                    })
                }
            })
        } else if (value.startsWith("DO: ")) {
            const withoutPrefix = value.trim().slice(4)
            latestDOState = withoutPrefix

            withoutPrefix.split("").forEach((state, index) => {
                const elem = document.getElementById(`output${index}`)
                if (state == "?") {
                    elem.src = "assets/unknown.svg"
                } else {
                    if (parseInt(state)) {
                        elem.src = "assets/outputhigh.png"
                    } else {
                        elem.src = "assets/outputlow.png"
                    }
                }
            })
        } else if (value.startsWith("SERVO: ")) {
            const withoutPrefix = value.trim().slice(7)
            latestServoAngles = withoutPrefix.split(" ").map(a => isNaN(parseInt(a)) ? a : parseInt(a))

            withoutPrefix.split(" ").forEach((angle, pinNum) => {
                const correspondingSlider = document.getElementById(`setServoAngle${pinNum}`)
                if (correspondingSlider == null) {
                    return
                }
                correspondingSlider.disabled = angle === "?"

                if (!isNaN(parseInt(angle))) {
                    document.getElementById(`setServoAngleLabel${pinNum}`).innerText = correspondingSlider.value = angle
                }
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
 * Gets a writer from the output stream and send the lines along the serial connection.
 * @param  {...string} lines lines to send on serial, with line endings
 */
function writeToStream(...lines) {
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
        this.container = ""
    }

    transform(chunk, controller) {
        this.container += chunk
        const lines = this.container.split("\n")
        this.container = lines.pop()
        lines.forEach(line => controller.enqueue(line))
    }

    flush(controller) {
        controller.enqueue(this.container)
    }
}

function toggleUIConnected(connected) {
    butConnect.textContent = connected ? "Disconnect" : "Connect"
}

// bound to onclick
// eslint-disable-next-line no-unused-vars
function handleAutoRefreshChange() {
    const isNowChecked = document.getElementById("butAutoRefresh").checked

    if (autoRefreshIntervalID !== undefined) {
        clearInterval(autoRefreshIntervalID)
    }

    if (isNowChecked) {
        autoRefreshIntervalID = window.setInterval(clickRefresh, 500)
    }
}

autoRefreshIntervalID = window.setInterval(clickRefresh, 500)
