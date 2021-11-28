"use strict"

/* global AvrgirlArduino, TextEncoderStream, TextDecoderStream, TransformStream, Uint8Array */

const default_code = `
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
    incomingStuff = Serial.readStringUntil('\\n');

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

        Serial.print("\\n");
    } else if (incomingStuff == "AI") {
        Serial.print("AI: ");
        for (int pin = 19; pin > 14; pin--) {
            Serial.print(analogRead(pin));
            Serial.print(" ");
        }
        Serial.print(analogRead(14));
        Serial.print("\\n");
    } else if (incomingStuff == "IOSTATE") {
        Serial.print("IOSTATE: ");
        for (int pin = 19; pin >= 0; pin--) {
            Serial.print(io_states[pin]);
        }
        Serial.print("\\n");
    } else if (incomingStuff.startsWith("IOSTATE=")) {
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
        Serial.print("\\n");
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
`

let port
let reader
let inputDone
let outputDone
let inputStream
let outputStream
let latest_iostate
let latest_do

const butConnect = document.getElementById("butConnect")
const butRefresh = document.getElementById("butRefresh")


document.addEventListener("DOMContentLoaded", () => {
    butConnect.addEventListener("click", clickConnect)
    butRefresh.addEventListener("click", clickRefresh)

    // CODELAB: Add feature detection here.
    const notSupported = document.getElementById("notSupported")
    notSupported.classList.toggle("hidden", "serial" in navigator)
})

async function clickRefresh() {
    if (port) {
        writeToStream("DO\n")
        writeToStream("DI\n")
        writeToStream("AI\n")
        writeToStream("IOSTATE\n")
    }
}

async function toggleState(pin) {
    if (port && latest_iostate != undefined) {
        let new_iostate = latest_iostate.split("")
        new_iostate[pin] = (latest_iostate[pin] == "1") ? "0" : "1"
        writeToStream("IOSTATE=" + new_iostate.reverse().join("") + "\n")
        clickRefresh()
    }
}

// Bound to an onclick which eslint cannot detect
// eslint-disable-next-line no-unused-vars
async function toggleDigitalOutput(pin) {
    if (port && latest_do != undefined) {
        let new_do = latest_do.split("")
        switch (latest_do[pin]) {
        case "1":
            new_do[pin] = "0"
            break
        case "0":
            new_do[pin] = "1"
            break
        case "?":
            toggleState(pin)
            new_do[20 - pin] = "1"
            break
        }
        await writeToStream("DO=" + new_do.reverse().join("") + "\n")
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
    const board_to_api = nano ? "arduino:avr:nano:cpu=atmega328" : "arduino:avr:uno"
    const board_to_upload = nano ? "nano" : "uno"
    options.baudRate = nano ? 57600 : 115200

    code = code == "" ? default_code : code

    var data = { sketch: code, board: board_to_api }

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
                    board: board_to_upload,
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
    while (true) {
        const { value, done } = await reader.read()

        console.log("[RECEIVED] " + value)

        if (value.trim() == "OK") {
            continue
        } else if (value.startsWith("DI: ")) {
            let outputs = value.trim().slice(4).split("").reverse().join("")
            outputs.split("").forEach((state, index) => {
                let elem = document.getElementById("input" + index)
                let new_src
                if (state == "?") {
                    new_src = "assets/unknown.svg"
                } else {
                    state = parseInt(state)
                    if (state) {
                        new_src = "assets/on.svg"
                    } else {
                        new_src = "assets/off.svg"
                    }
                }
                elem.src = new_src
            })
        } else if (value.startsWith("AI: ")) {
            let outputs = value.trim().slice(4).split(" ").reverse()
            outputs.forEach((state, index) => {
                let elem = document.getElementById("A" + index)
                elem.textContent = state.toString()
                elem = document.getElementById("A" + index + "V")
                elem.textContent = (Math.round((state / 1023 * 5) * 100) / 100).toString()
            })
        } else if (value.startsWith("IOSTATE: ")) {
            let outputs = value.trim().slice(9).split("").reverse().join("")
            latest_iostate = outputs
            outputs.split("").forEach((state, index) => {
                let elem = document.getElementById("state" + index)
                let new_src
                if (state == "?") {
                    new_src = "assets/unknown.svg"
                } else {
                    state = parseInt(state)
                    if (state) {
                        new_src = "assets/output.svg"
                    } else {
                        new_src = "assets/input.svg"
                    }
                }
                elem.src = new_src
            })
        } else if (value.startsWith("DO: ")) {
            let outputs = value.trim().slice(4).split("").reverse().join("")
            latest_do = outputs

            outputs.split("").forEach((state, index) => {
                let elem = document.getElementById("output" + index)
                let new_src
                if (state == "?") {
                    new_src = "assets/unknown.svg"
                } else {
                    state = parseInt(state)
                    if (state) {
                        new_src = "assets/outputhigh.png"
                    } else {
                        new_src = "assets/outputlow.png"
                    }
                }
                elem.src = new_src
            })
        } else {
            // Why are we here?
            return
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

window.setInterval(clickRefresh, 500)
