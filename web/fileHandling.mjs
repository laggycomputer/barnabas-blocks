import * as Blockly from "blockly/core"

import { appState, clickTab, getEditorType } from "./index"

/**
 * Backup code blocks to localStorage.
 */
export function backupBlocks() {
    if ("localStorage" in window) {
        const editor = getEditorType()
        if (editor == "blocks") {
            const xml = Blockly.Xml.workspaceToDom(appState.workspace)
            window.localStorage.setItem("arduino", Blockly.Xml.domToText(xml))
        } else {
            // window.localStorage.setItem('arduino', document.getElementById("content_arduino").value);
            window.localStorage.setItem("arduino", appState.aceObj.getValue())
        }
    }
}

/**
 * Restore code blocks from localStorage.
 */
export function restoreBlocks() {
    if ("localStorage" in window && window.localStorage.arduino) {
        const editor = getEditorType()
        if (editor == "blocks") {
            const xml = new DOMParser().parseFromString(window.localStorage.arduino, "text/xml").documentElement
            Blockly.Xml.domToWorkspace(xml, appState.workspace)
        } else {
            // document.getElementById("content_arduino").value = window.localStorage.arduino;
            appState.aceObj.setValue(window.localStorage.arduino)
            appState.aceObj.gotoLine(1)
        }
    }
}

/**
 * Load blocks from local file.
 */
export function load(event) {
    const files = event.target.files
    // Only allow uploading one file.
    if (files.length != 1) {
        return
    }

    const editor = getEditorType()
    // FileReader
    const reader = new FileReader()
    reader.onloadend = function (event) {
        const target = event.target
        // 2 == FileReader.DONE
        if (target.readyState == 2) {
            if (editor == "blocks") {
                let xml
                try {
                    xml = new DOMParser().parseFromString(target.result, "text/xml").documentElement
                } catch (e) {
                    alert("Error parsing XML:\n" + e)
                    return
                }
                const count = appState.workspace.getAllBlocks().length
                if (count && confirm(Blockly.Msg.REPLACE_TEXT1 + "\n" + Blockly.Msg.REPLACE_TEXT2)) {
                    appState.workspace.clear()
                }
                Blockly.Xml.domToWorkspace(xml, appState.workspace)
            } else {
                document.getElementById("content_arduino").value = target.result
                appState.aceObj.setValue(target.result)
                appState.aceObj.gotoLine(1)
                clickTab("editor")
            }
        }
        // Reset value of input after loading because Chrome will not fire
        // a 'change' event if the same file is loaded again.
        document.getElementById("load").value = ""
    }
    reader.readAsText(files[0])
}

/*
 * auto backup and restore blocks
 */

export function autoBackupAndRestoreBlocks() {
    // Restore saved blocks in a separate thread so that subsequent
    // initialization is not affected from a failed load.
    window.setTimeout(restoreBlocks, 0)
    // Hook a save function onto unload.
    bindEvent(window, "unload", backupBlocks)
    clickTab(appState.selectedTabId)

    // Init load event.
    const loadInput = document.getElementById("load")
    loadInput.addEventListener("change", load, false)
    document.getElementById("loadButton").onclick = function () {
        loadInput.click()
    }
}

/**
 * Bind an event to a function call.
 * @param {!Element} element Element upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {!Function} func Function to call when event is triggered.
 *     W3 browsers will call the function with the event object as a parameter,
 *     MSIE will not.
 */
export function bindEvent(element, name, func) {
    if (element.addEventListener) { // W3C
        element.addEventListener(name, func, false)
    } else if (element.attachEvent) { // IE
        element.attachEvent("on" + name, func)
    }
}
