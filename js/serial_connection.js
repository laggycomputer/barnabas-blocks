/* spaceneedle stole chrome's arduino serial port example, thanks guys for the great foundation to build up from. no idea what half this crap is. */

var SerialConnection = function () {
  this.connectionId = -1;
  this.baud = 115200;
  this.lineBuffer = '';

  this.boundOnReceive = this.onReceive.bind(this);
  this.boundOnReceiveError = this.onReceiveError.bind(this);
  serial.onReceive.addListener(this.boundOnReceive);
  serial.onReceiveError.addListener(this.boundOnReceiveError);

  this.onConnect = new chrome.Event();
  this.onReadLine = new chrome.Event();
  this.onError = new chrome.Event();
};

SerialConnection.prototype.onReceive = function (receiveInfo) {
  if (receiveInfo.connectionId !== this.connectionId) {
    return;
  }

  this.lineBuffer += ab2str(receiveInfo.data);
  var d = new Date();
  var n = d.getMilliseconds();
  var buffer = this.lineBuffer;
  var decoded = '';
  for (x = 0; x < buffer.length; x++) { decoded += '[' + buffer.charCodeAt(x).toString(16) + ']'; }
  // console.log(n+" length: "+buff.length);
  if (verbose_logging) console.log(n + ' received data: ' + decoded);
  /*if(termmode == 1) {

//    $("#terminal").text() = tlen.substr(0,tlen.length-1);
 // $("#terminal").append(buffer+"&#9608;"); }
    
    $("#terminal").append(buffer); var elem = document.getElementById('terminal');
    elem.scrollTop = elem.scrollHeight; } */
  if (terminal && termmode === 1) terminal.message(buffer);
  this.lineBuffer = '';
  var index;
  while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
    var line = this.lineBuffer.substr(0, index + 1);
    this.onReadLine.dispatch(line);
    this.lineBuffer = this.lineBuffer.substr(index + 1);
  }
};

SerialConnection.prototype.onReceiveError = function (errorInfo) {
  if (errorInfo.connectionId === this.connectionId) {
    this.onError.dispatch(errorInfo);
  }
};

SerialConnection.prototype.getDevices = function (callback) {
  serial.getDevices(callback);
};

SerialConnection.prototype.connect = function (path) {
  serial.connect(path, { bitrate: this.baud }, connectionInfo => {
    if (!connectionInfo) {
      log('Connection failed.');
      return;
    }
    this.connectionId = connectionInfo.connectionId;
    this.onConnect.dispatch();
    serial.setControlSignals(connection.connectionId, DTRRTSOn, function (result) {
      console.log('DTR on: ' + result);
    });
  });
};

SerialConnection.prototype.send = function (msg) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.send(this.connectionId, str2ab(msg), function () { });
};

SerialConnection.prototype.disconnect = function () {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.disconnect(this.connectionId, success => {
    if (!success) console.error('could not disconnect');
    this.connectionId = -1;
  });
};

SerialConnection.prototype.setBaud = function (baud) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  if (this.baud === baud) return;
  serial.update(this.connectionId, { bitrate: baud }, success => {
    if (success) {
      console.log('Baud for connection set to ' + baud);
      this.baud = baud;
    }
    else console.error('Could not set baud rate.');
  });
};

SerialConnection.prototype.tempBaud = function (baud, cb) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.update(this.connectionId, { bitrate: baud }, success => {
    if (success) {
      console.log('Baud for connection set to ' + baud + ' temporarily');
    }
    else console.error('Could not set baud rate.');
    cb(success);
  });
};

SerialConnection.prototype.resetBaud = function (cb) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.update(this.connectionId, { bitrate: this.baud }, success => {
    if (success) {
      console.log('Baud for connection set back to ' + this.baud);
    }
    else console.error('Could not set baud rate.');
    cb(success);
  });
};

SerialConnection.prototype.isConnected = function () {
  return this.connectionId > 0;
};

const connection = new SerialConnection();