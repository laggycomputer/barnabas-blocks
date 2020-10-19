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

const monitor = document.getElementById('content_monitor');
const btnMonitor = document.getElementById('monitorButton');


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
  await port.open({ baudrate: 9600, baudRate: 9600});

  // CODELAB: Add code setup the output stream here.
  const encoder = new TextEncoderStream();
  outputDone = encoder.readable.pipeTo(port.writable);
  outputStream = encoder.writable;

  // *******************************************************************
  // CODELAB: Send CTRL-C and turn off echo on REPL
//   writeToStream('\x03', 'echo(false);');

  // CODELAB: Add code to read the stream here.
  let decoder = new TextDecoderStream();
  inputDone = port.readable.pipeTo(decoder.writable);
  inputStream = decoder.readable;
    // .pipeThrough(new TransformStream(new LineBreakTransformer()));
    // .pipeThrough(new TransformStream(new JSONTransformer()));

  reader = inputStream.getReader();
  btnMonitor.innerText = 'CONNECTED';
  btnMonitor.classList.add('ready');
  btnMonitor.title = 'Click to DISCONNECT';
  monitor.textContent = 'Connected!...\n'
  readLoop();

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
  monitor.textContent += '\nDisconnected';
  console.log('Port closed');
  btnMonitor.innerText = 'CONNECT';
  btnMonitor.classList.remove('ready');
  btnMonitor.title = 'Click to CONNECT';
}


/**
 * @name clickConnect
 * Click handler for the connect/disconnect button.
 */
async function connectUSB() {
    if ('serial' in navigator) {
        if (port) {
            await disconnect();
            btnMonitor.innerText = 'CONNECT';
            btnMonitor.classList.remove('ready');
            btnMonitor.title = 'Click to CONNECT';
            return;
          }
          // CODELAB: Add connect code here.
          await connect();
          btnMonitor.innerText = 'CONNECTED';
          btnMonitor.classList.add('ready');
          btnMonitor.title = 'Click to DISCONNECT';
    } else {
        console.error('Browser does not support Web Serial');
    }
}


/**
 * @name readLoop
 * Reads data from the input stream and displays it on screen.
 */
async function readLoop() {
  // CODELAB: Add read loop here.
  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      monitor.textContent += value + '';
      monitor.scrollTop = monitor.scrollHeight;
      // console.log(value + '\n');
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
    // consider + \n or \c\r
    writer.write(line);
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
    console.info('chunk');
    console.info(chunk);
    const lines = this.container.split('\r\n');
    console.info('After Line split');
    this.container = lines.pop();
    console.info('After pop');
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
