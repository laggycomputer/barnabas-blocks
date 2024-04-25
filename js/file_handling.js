/* globals Blockly, Code */

/**
 * Backup code blocks to localStorage.
 */
function backup_blocks() {
  if ('localStorage' in window) {
    let editor = Code.getEditor();
    if (editor == 'blocks') {
      var xml = Blockly.Xml.workspaceToDom(Code.workspace);
      window.localStorage.setItem('arduino', Blockly.Xml.domToText(xml));
    } else {
      // window.localStorage.setItem('arduino', document.getElementById("content_arduino").value);
      window.localStorage.setItem('arduino', Code.ace.getValue());
    }
  }
}

/**
 * Restore code blocks from localStorage.
 */
function restore_blocks() {
  if ('localStorage' in window && window.localStorage.arduino) {
    let editor = Code.getEditor();
    if (editor == 'blocks') {
      var xml = Blockly.Xml.textToDom(window.localStorage.arduino);
      Blockly.Xml.domToWorkspace(xml, Code.workspace);
    } else {
      // document.getElementById("content_arduino").value = window.localStorage.arduino;
      Code.ace.setValue(window.localStorage.arduino);
      Code.ace.gotoLine(1);
    }
  }
}

/**
 * Load blocks from local file.
 */
function load(event) {
  var files = event.target.files;
  // Only allow uploading one file.
  if (files.length != 1) {
    return;
  }

  var editor = Code.getEditor();
  // FileReader
  var reader = new FileReader();
  reader.onloadend = function (event) {
    var target = event.target;
    // 2 == FileReader.DONE
    if (target.readyState == 2) {
      if (editor == 'blocks') {
        try {
          var xml = Blockly.Xml.textToDom(target.result);
        } catch (e) {
          alert('Error parsing XML:\n' + e);
          return;
        }
        var count = Code.workspace.getAllBlocks().length;
        if (count && confirm(Blockly.Msg.REPLACE_TEXT1 + '\n' + Blockly.Msg.REPLACE_TEXT2)) {
          Code.workspace.clear();
        }
        Blockly.Xml.domToWorkspace(xml, Code.workspace);
      } else {
        document.getElementById('content_arduino').value = target.result;
        Code.ace.setValue(target.result);
        Code.ace.gotoLine(1);
        Code.tabClick('editor');
      }
    }
    // Reset value of input after loading because Chrome will not fire
    // a 'change' event if the same file is loaded again.
    document.getElementById('load').value = '';
  };
  reader.readAsText(files[0]);
}

/*
 * auto backup and restore blocks
 */
// eslint-disable-next-line no-unused-vars
function auto_backup_and_restore_blocks() {
  // Restore saved blocks in a separate thread so that subsequent
  // initialization is not affected from a failed load.
  window.setTimeout(restore_blocks, 0);
  // Hook a save function onto unload.
  bindEvent(window, 'unload', backup_blocks);
  Code.tabClick(Code.selected);

  // Init load event.
  var loadInput = document.getElementById('load');
  loadInput.addEventListener('change', load, false);
  document.getElementById('loadButton').onclick = function () {
    loadInput.click();
  };
}

/**
 * Bind an event to a function call.
 * @param {!Element} element Element upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {!Function} func Function to call when event is triggered.
 *     W3 browsers will call the function with the event object as a parameter,
 *     MSIE will not.
 */
function bindEvent(element, name, func) {
  if (element.addEventListener) {  // W3C
    element.addEventListener(name, func, false);
  } else if (element.attachEvent) {  // IE
    element.attachEvent('on' + name, func);
  }
}
