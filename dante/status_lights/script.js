/*
 * @license
 * Getting Started with Web Serial Codelab (https://todo)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';



let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

const log = document.getElementById('log');
const butConnect = document.getElementById('butConnect');
const butRefresh = document.getElementById('butRefresh');
const butModeSubmit = document.getElementById('butModeSubmit');
const digital_pin_names = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
const analog_pin_names = ["A0", "A1", "A2", "A3", "A4", "A5"];


document.addEventListener('DOMContentLoaded', () => {
    butConnect.addEventListener('click', clickConnect);
    butRefresh.addEventListener('click', clickRefresh);
    butModeSubmit.addEventListener('click', clickModeSubmit);

    // CODELAB: Add feature detection here.
    const notSupported = document.getElementById('notSupported');
    notSupported.classList.toggle('hidden', 'serial' in navigator);
});

async function clickModeSubmit() {
    if (port) {
        const pin_to_update = document.getElementById("pinToChangeMode").value;
        const state_to_set = document.getElementById("modeOptions").value;
        await writeToStream("u\r", state_to_set + pin_to_update + "\n");
    }
}


async function clickRefresh() {
    if (port) {
        await writeToStream("g\n");
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
    port = await navigator.serial.requestPort();
    // - Wait for the port to open.
    await port.open({baudRate: 19200});
    // CODELAB: Add code setup the output stream here.
    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;
    // CODELAB: Add code to read the stream here.
    let decoder = new TextDecoderStream();
    inputStream = decoder.readable
    .pipeThrough(new TransformStream(new LineBreakTransformer()));
    inputDone = port.readable.pipeTo(decoder.writable);
    reader = inputStream.getReader();
    readLoop();
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
        await reader.cancel();
        await inputDone.catch(() => {});
        reader = null;
        inputDone = null;
    }
    // CODELAB: Close the output stream.
    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }
    // CODELAB: Close the port.
    await port.close();
    port = null;
}

var str2ab = function (str) {
    // var encodedString = unescape(encodeURIComponent(str));
    var encodedString = str;
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};

function flashCode(code, nano=false, options={}) {
    if (nano) {
        var board_to_api = "arduino:avr:nano:cpu=atmega328";
        var board_to_upload = "nano";
    } else {
        var board_to_api = "arduino:avr:uno";
        var board_to_upload = "uno";
    }
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", "repl/repl.ino", false);
    xmlhttp.send();
    if (xmlhttp.status == 200) {
        result = xmlhttp.responseText;
    }
    var result = code;

    var data = { sketch: result, board: board_to_api };

    fetch(
    "https://compile.barnabasrobotics.com/compile", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
        }
    ).then(response => response.json()).then(data => {
        if (!data.success) {
            // can only run below if arduino compile error I can still get response with garbage body
            if (data.stderr.length > 0) {
                let regex = /\/tmp\/chromeduino\-(.*?)\/chromeduino\-(.*?)\.ino\:/g;
                let message = data.stderr.replace(regex, "");
                uploadLog.textContent += "Compilation error:\n" + message + "\n"
                regex = /\d+\:\d+/g;
            }
        } else {
            let hexstring = atob(data.hex);
            return { 'data': hexstring, 'msg': data.stdout };
        }
    }).then(hex => {
        if (hex) {
            try {
                var avrgirl = new AvrgirlArduino({
                    board: board_to_upload,
                    debug: false
                });

                avrgirl.flash(str2ab(hex.data), (error) => {
                    // gear.classList.remove('spinning');
                    // progress.textContent = "done!";
                    if (error) {
                        uploadLog.textContent += "Upload error:\n" + error + "\n";
                        avrgirl.connection.serialPort.close();
                    } else {
                        uploadLog.textContent += "Upload successful.\n";
                    }
                }, options);
            } catch (error) {
                uploadLog.textContent += "AVR error:\n" + error + "\n";
                avrgirl.connection.serialPort.close();
            }
        }
    });
}

/**
 * @name clickConnect
 * Click handler for the connect/disconnect button.
 */
async function clickConnect() {
    // CODELAB: Add disconnect code here.
    if (port) {
        await disconnect();
        toggleUIConnected(false);
        return;
    }
    // CODELAB: Add connect code here.
    await connect();

    toggleUIConnected(true);
}


/**
 * @name readLoop
 * Reads data from the input stream and displays it on screen.
 */
async function readLoop() {
    // CODELAB: Add read loop here.
    while (true) {
        const { value, done } = await reader.read();

        let bit_chunks = value.trim().split(" ");
        let digitals = bit_chunks.slice(0, 14);
        let analogs = bit_chunks.slice(14);

        for (let digital_pin_number = 0; digital_pin_number < 14; digital_pin_number++) {
            let elem_to_update = document.getElementById("bool" + digital_pin_names[digital_pin_number]);
            if (digitals[digital_pin_number] != "?") {
                let state = parseInt(digitals[digital_pin_number]);
                if (state) {
                    elem_to_update.src = "assets/on.svg";
                } else {
                    elem_to_update.src = "assets/off.svg";
                }
            } else {
              elem_to_update.src = "assets/unknown.svg"
            }
        }

        for (let analog_pin_number = 0; analog_pin_number < 6; analog_pin_number++) {
            let elem_to_update = document.getElementById("bool" + analog_pin_names[analog_pin_number]);
            if (analogs[analog_pin_number] != "?") {
                let state = parseInt(analogs[analog_pin_number]);
                if (state > 1023) {
                    state = 1023;
                } else if (state < 0) {
                    state = 0;
                }
                if (state) {
                    elem_to_update.src = "assets/on.svg"
                } else {
                    elem_to_update.src = "assets/off.svg"
                }
                state = (state + 1) / 1024 * 5;
                document.getElementById(analog_pin_names[analog_pin_number]).innerHTML = state.toFixed(2).toString();
            } else {
                elem_to_update.src = "assets/unknown.svg";
                document.getElementById(analog_pin_names[analog_pin_number]).innerHTML = "(pin in output mode)";
            }
        }

        if (done) {
            console.log('[readLoop] DONE', done);
            reader.releaseLock();
            break;
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
    const writer = outputStream.getWriter();
    lines.forEach((line) => {
        console.log('[SEND]', line);
        writer.write(line); // Allow user to specify which line ending
    });
    writer.releaseLock();
}

/**
 * @name LineBreakTransformer
 * TransformStream to parse the stream into lines.
 */
class LineBreakTransformer {
    constructor() {
    // A container for holding stream data until a new line.
        this.container = '';
    }

    transform(chunk, controller) {
    // CODELAB: Handle incoming chunk
        this.container += chunk;
        const lines = this.container.split('\n');
        this.container = lines.pop();
        lines.forEach(line => controller.enqueue(line));
    }

    flush(controller) {
    // CODELAB: Flush the stream.
        controller.enqueue(this.container);
    }
}


/**
 * @name JSONTransformer
 * TransformStream to parse the stream into a JSON object.
 */
class JSONTransformer {
    transform(chunk, controller) {
    // CODELAB: Attempt to parse JSON content
    try {
        controller.enqueue(JSON.parse(chunk));
    } catch (e) {
        controller.enqueue(chunk);
    }
    }
}

/**
 * The code below is mostly UI code and is provided to simplify the codelab.
 */

function toggleUIConnected(connected) {
    let lbl = 'Connect';
    if (connected) {
        lbl = 'Disconnect';
    }
    butConnect.textContent = lbl;
}
