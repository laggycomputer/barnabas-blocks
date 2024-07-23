import { TypedVariableModal } from "@blockly/plugin-typed-variable-modal"
import ace from "ace-builds"
import "ace-builds/esm-resolver"
import "ace-builds/src-noconflict/ext-language_tools"
import AvrgirlArduino from "avrgirl-arduino/avrgirl-arduino-browser"
import * as Blockly from "blockly/core"
import * as localeEn from "blockly/msg/en"
import CryptoJS from "crypto-js"
import { ESPLoader, Transport } from "esptool-js/lib/index.js"
import { saveAs } from "file-saver"
import "material-icons/iconfont/material-icons.css"
import stripAnsi from "strip-ansi"

import addlTranslations from "./blocklyAddlTranslations.mjs"
import "./blocks/blocks"
import * as fileHandling from "./fileHandling.mjs"
import arduinoGenerator from "./generator/arduinoGenerator"
import "./style.css"
import * as usbSerial from "./usbSerial.mjs"

const COMPILE_URL = "https://compile.barnabasrobotics.com"

/**
 * Lookup for names of supported languages.  Keys should be in ISO 639 format.
 */
const LANGUAGE_NAME = {
    en: "English",
    // 'es': 'Español'
}

/**
 * List of RTL languages.
 */
const LANGUAGE_RTL = ["ar", "fa", "he", "lki"]

const TABS = [["Blocks", "blocks"], ["Arduino", "arduino"], ["Serial Monitor", "monitor"], ["XML", "xml"], ["Editor", "editor"]]

export const appState = {
    /**
     * User's language (e.g. "en").
     * @type {string}
     */
    LANG: getLang(),
    /**
     * Blockly's main workspace.
     * @type {Blockly.WorkspaceSvg}
     */
    workspace: null,
    serialMonitorPort: null,
    aceObj: ace.edit("content_editor", {
        theme: "ace/theme/textmate",
        mode: "ace/mode/c_cpp",
        showPrintMargin: false,
        tabSize: 4,
    }),
    selectedTabId: getEditorType(),
}

/**
 * Extracts a parameter from the URL.
 * If the parameter is absent default_value is returned.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue Value to return if parameter not found.
 * @return {string} The parameter value or the default value if not found.
 */
export function getStringParamFromUrl(name, defaultValue) {
    const val = location.search.match(new RegExp("[?&]" + name + "=([^&]+)"))
    return val ? decodeURIComponent(val[1].replace(/\+/g, "%20")) : defaultValue
}

/**
 * Get the language of this user from the URL.
 * @return {string} User's language.
 */
export function getLang() {
    let lang = getStringParamFromUrl("lang", "")
    if (LANGUAGE_NAME[lang] === undefined) {
        // Default to English.
        lang = "en"
    }
    return lang
}

/**
 * Get the board of this user from the URL.
 * @return {string} User's board.
 */
export function getBoard() {
    let board = window.localStorage.board
    if (board === undefined || board == null || board === "") {
        // Default to nano.
        board = "nano"
        localStorage.setItem("board", board)
    }
    return board
}

/**
 * Get the configured text editor font size.
 * @returns {number} Set font size or a default.
 */
export function getAceFontSize() {
    let configuredSize = localStorage.getItem("aceFontSize")
    if (configuredSize === undefined || configuredSize == null || configuredSize === "") {
        // nothing found.
        configuredSize = "12"
        localStorage.setItem("aceFontSize", configuredSize)
    }

    return parseInt(configuredSize)
}

/**
 * Get the board of this user from the URL.
 * @return {string} User's board.
 */
export function getLesson() {
    let lesson = localStorage.getItem("lesson")
    if (lesson === undefined || lesson == null || lesson === "") {
        // Default to bot.
        lesson = "bot"
        localStorage.setItem("lesson", lesson)
    }
    return lesson
}

/**
 * Get the editor status of this user from storage.
 * @return {string} User's editor, "blocks" for blocks or "editor" for text1
 */
export function getEditorType() {
    let editor = localStorage.getItem("editor")
    if (editor === undefined || editor == null || editor === "") {
        editor = "blocks"
        localStorage.setItem("editor", editor)
    }
    return editor
}

export function setEditor() {
    let editor = localStorage.getItem("editor")
    if (editor == "blocks") {
        localStorage.setItem("editor", "editor")
    } else
        localStorage.setItem("editor", "blocks")
}

/**
 * Is the current language (state.LANG) an RTL language?
 * @return {boolean} True if RTL, false if LTR.
 */
export function isRtl() {
    return LANGUAGE_RTL.indexOf(appState.LANG) != -1
}

/**
 * Load blocks saved on App Engine Storage or in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 */
export function loadBlocks(defaultXml) {
    let loadOnce
    try {
        loadOnce = window.sessionStorage.loadOnceBlocks
    } catch {
        // Firefox sometimes throws a SecurityError when accessing sessionStorage.
        // Restarting Firefox fixes this, so it looks like a bug.
        loadOnce = null
    }
    if ("BlocklyStorage" in window && window.location.hash.length > 1) {
        // An href with #key trigers an AJAX call to retrieve saved blocks.
        BlocklyStorage.retrieveXml(window.location.hash.substring(1))
    } else if (loadOnce) {
        // Language switching stores the blocks during the reload.
        delete window.sessionStorage.loadOnceBlocks
        const xml = Blockly.Xml.workspaceToDom(loadOnce)
        Blockly.Xml.domToWorkspace(xml, appState.workspace)
    } else if (defaultXml) {
        // Load the editor with default starting blocks.
        const xml = Blockly.Xml.workspaceToDom(defaultXml)
        Blockly.Xml.domToWorkspace(xml, appState.workspace)
    } else if ("BlocklyStorage" in window) {
        // Restore saved blocks in a separate thread so that subsequent
        // initialization is not affected from a failed load.
        window.setTimeout(BlocklyStorage.restoreBlocks, 0)
    }
}

/**
 * Save the blocks and reload with a different language.
 */
export function changeLanguage() {
    // Store the blocks for the duration of the reload.
    // MSIE 11 does not support sessionStorage on file:// URLs.
    if (window.sessionStorage) {
        const xml = Blockly.Xml.workspaceToDom(appState.workspace)
        const text = Blockly.Xml.domToText(xml)
        window.sessionStorage.loadOnceBlocks = text
    }

    const languageMenu = document.getElementById("languageMenu")
    const newLang = encodeURIComponent(languageMenu.options[languageMenu.selectedIndex].value)
    let search = window.location.search
    if (search.length <= 1) {
        search = "?lang=" + newLang
    } else if (search.match(/[?&]lang=[^&]*/)) {
        search = search.replace(/([?&]lang=)[^&]*/, "$1" + newLang)
    } else {
        search = search.replace(/\?/, "?lang=" + newLang + "&")
    }

    window.location = window.location.otocol + "//" + window.location.host + window.location.pathname + search
}

/**
 * Changes the output language by clicking the tab matching
 * the selected language in the codeMenu.
 */
export function changeCodingLanguage() {
    const codeMenu = document.getElementById("code_menu")
    clickTab(codeMenu.options[codeMenu.selectedIndex].value)
}

/**
 * Bind a function to a button's click event.
 * On touch enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {!Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
export function bindClick(el, func) {
    if (typeof el == "string") {
        el = document.getElementById(el)
    }
    el.addEventListener("click", func, true)
    el.addEventListener("touchend", func, true)
}

/**
 * Compute the absolute coordinates and dimensions of an HTML element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
export function getBBox(element) {
    const height = element.offsetHeight
    const width = element.offsetWidth
    let x = 0
    let y = 0
    do {
        x += element.offsetLeft
        y += element.offsetTop
        element = element.offsetParent
    } while (element)
    return {
        height: height,
        width: width,
        x: x,
        y: y,
    }
}

/**
 * Switch the visible pane when a tab is clicked.
 * @param {string} clickedName Name of tab clicked.
 */
export function clickTab(clickedName) {
    // If the XML tab was open, save and render the content.
    if (document.getElementById("tab_xml").classList.contains("tabon")) {
        const xmlTextarea = document.getElementById("content_xml")
        const xmlText = xmlTextarea.value
        let xmlDom = null
        try {
            xmlDom = new DOMParser().parseFromString(xmlText, "text/xml").documentElement
        } catch (e) {
            if (!window.confirm(STRINGS["badXml"].replace("%1", e))) {
                // Leave the user on the XML tab.
                return
            }
        }
        if (xmlDom) {
            appState.workspace.clear()
            Blockly.Xml.domToWorkspace(xmlDom, appState.workspace)
        }
    }

    if (document.getElementById("tab_blocks").classList.contains("tabon")) {
        appState.workspace.setVisible(false)
    }
    // Deselect all tabs and hide all panes.
    for (const [, tabId] of TABS) {
        const tab = document.getElementById("tab_" + tabId)
        tab.classList.add("taboff")
        tab.classList.remove("tabon")
        document.getElementById("content_" + tabId).style.visibility = "hidden"
    }

    // Select the active tab.
    appState.selectedTabId = clickedName
    const selectedTab = document.getElementById("tab_" + clickedName)
    selectedTab.classList.remove("taboff")
    selectedTab.classList.add("tabon")
    // Show the selected pane.
    document.getElementById("content_" + clickedName).style.visibility
        = "visible"
    renderContent()
    // The code menu tab is on if the blocks tab is off.
    const codeMenuTab = document.getElementById("tab_code")
    if (clickedName == "blocks") {
        appState.workspace.setVisible(true)
        codeMenuTab.className = "taboff"
    } else {
        codeMenuTab.className = "tabon"
    }
    // if (clickedName == 'monitor') {

    // } else if (isConnected()= false) {

    // }
    // Sync the menu's value with the clicked tab value if needed.
    const codeMenu = document.getElementById("code_menu")
    for (let i = 0; i < codeMenu.options.length; i++) {
        if (codeMenu.options[i].value == clickedName) {
            codeMenu.selectedIndex = i
            break
        }
    }

    if (clickedName == "monitor") {
        if (!appState.serialMonitorPort) {
            usbSerial.connect()
        }
    } else {
        if (appState.serialMonitorPort) {
            usbSerial.disconnect()
        }
    }

    Blockly.svgResize(appState.workspace)
}

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
export function renderContent() {
    const content = document.getElementById("content_" + appState.selectedTabId)
    // Initialize the pane.
    if (content.id == "content_xml") {
        const xmlTextarea = document.getElementById("content_xml")
        const xmlDom = Blockly.Xml.workspaceToDom(appState.workspace)
        const xmlText = Blockly.Xml.domToPrettyText(xmlDom)
        xmlTextarea.value = xmlText
        xmlTextarea.focus()
    } else if (content.id == "content_arduino" && getEditorType() == "blocks") {
        attemptCodeGeneration(arduinoGenerator)
    } else if (content.id == "content_editor" && getEditorType() == "blocks") {
        attemptCodeGeneration(arduinoGenerator)
    }

    for (const id of [
        "monitorButton",
        "clearMonitor",
        "textToSend",
        "sendButton",
        "editorFontReset",
        "editorFontUp",
        "editorFontDown",
    ]) {
        document.getElementById(id).style.display = (content.id == "content_monitor") ? "" : "none"
    }
}

/**
 * Attempt to generate the code and display it in the UI, pretty printed.
 * @param generator {!Blockly.Generator} The generator to use.
 */
export function attemptCodeGeneration(generator) {
    const content = document.getElementById("content_" + appState.selectedTabId)
    // content.textContent = '';
    content.value = ""
    if (checkAllGeneratorFunctionsDefined(generator) && checkForBlockRoots()) {
        const code = generator.workspaceToCode(appState.workspace)

        appState.aceObj.setValue(code)
        appState.aceObj.gotoLine(1)
    }
}

/**
 * Check whether all blocks in use have generator functions.
 * @param generator {!Blockly.Generator} The generator to use.
 */
export function checkAllGeneratorFunctionsDefined(generator) {
    const blocks = appState.workspace.getAllBlocks(false)

    const missingBlockGenerators = new Set(blocks
        .map(block => block.type)
        .filter(blockType => !(blockType in generator.forBlock)))

    const valid = missingBlockGenerators.size == 0
    if (!valid) {
        const msg = "The generator code for the following blocks not specified for "
            + generator.name_ + ":\n - " + Array.from(missingBlockGenerators).join("\n - ")
        Blockly.dialog.alert(msg) // Assuming synchronous. No callback.
    }
    return valid
}

export function checkForBlockRoots() {
    let lesson = getLesson()
    let blocks = lesson == "bot" ? appState.workspace.getBlocksByType("controls_loop") : appState.workspace.getBlocksByType("controls_setup")

    let roots = blocks.length
    let singleRoot = roots == 1

    if (roots > 1) {
        Blockly.dialog.alert("You have more than one LOOP block!\n\nTry removing a block")
        let smallest = 999
        let identifier = 0
        for (const [key, value] of Object.entries(blocks)) {
            let size = 0
            if (value.childBlocks_.length) {
                size = value.childBlocks_[0].childBlocks_.length
            }
            if (size < smallest) {
                smallest = size
                identifier = key
            }
        }
        clickTab("blocks")
        Blockly.dialog.alert("This Block has the least amount of calls")
        blocks[identifier].select()
        appState.workspace.centerOnBlock(blocks[identifier].id)
    } else if (roots < 1) {
        (appState.workspace.getToolbox().getFlyout().show(document.getElementById(lesson + "_controls")))
        Blockly.dialog.alert("YOU NEED A LOOP BLOCK")
    }
    return singleRoot
}

/**
 * Initialize Blockly.  Called on page load.
 */
export function init() {
    window.addEventListener("click", (event) => {
        const modal = document.getElementById("arduinoOutput")
        if (event.target == modal) {
            modal.style.display = "none"
        }
    })
    initSerial()
    initLanguage()
    initSelects()

    const rtl = isRtl()
    const container = document.getElementById("content_area")
    const onresize = () => {
        const bBox = getBBox(container)
        for (const [, tabId] of TABS) {
            const el = document.getElementById("content_" + tabId)
            el.style.top = bBox.y + "px"
            el.style.left = bBox.x + "px"
            // Height and width need to be set, read back, then set again to
            // compensate for scrollbars.
            el.style.height = bBox.height + "px"
            el.style.height = (2 * bBox.height - el.offsetHeight) + "px"
            el.style.width = bBox.width + "px"
            el.style.width = (2 * bBox.width - el.offsetWidth) + "px"
        }
        // Make the 'Blocks' tab line up with the toolbox.
        if (appState.workspace && appState.workspace.getToolbox().width) {
            document.getElementById("tab_blocks").style.minWidth
                = (appState.workspace.getToolbox().width - 56) + "px"
            // Account for the 19 pixel margin and on each side.
        }
    }
    window.addEventListener("resize", onresize, false)

    Blockly.setLocale(localeEn)
    Blockly.setLocale(addlTranslations)
    appState.workspace = Blockly.inject("content_blocks", {
        grid: {
            spacing: 25,
            length: 3,
            colour: "#aaa",
            snap: true,
        },
        rtl: rtl,
        toolbox: buildToolbox(),
        renderer: "zelos",
        theme: "barnabas",
        zoom: {
            controls: true,
            wheel: false,
        },
    })

    loadBlocks("")

    if ("BlocklyStorage" in window) {
        // Hook a save function onto unload.
        BlocklyStorage.backupOnUnload(appState.workspace)
    }

    fileHandling.autoBackupAndRestoreBlocks()

    document.getElementById("boardSelect").addEventListener("change", function () {
        localStorage.setItem("board", this.value)
        document.getElementById("board").textContent = document.getElementById("boardSelect").value// MSG['title'];

        if (this.value == "ezDisplay" || getLesson() == "ezDisplay") {
            document.getElementById("img2hex").classList.remove("hide")
            document.getElementById("compileButton").classList.add("hide")
        } else {
            document.getElementById("img2hex").classList.add("hide")
            document.getElementById("compileButton").classList.remove("hide")
        }

        onresize()
    })

    document.getElementById("lessonSelect").addEventListener("change", function () {
        let prev = getLesson()
        localStorage.setItem("lesson", this.value)
        if (prev != this.value) {
            // document.getElementById('title').textContent = document.getElementById('lessonSelect').value;//MSG['title'];
            let newTree = buildToolbox(this.value)
            appState.workspace.updateToolbox(newTree)
            console.log(this.value)
            if (prev != "bot" && this.value === "bot") {
                document.getElementById("title").textContent = "BOT"
                discardBlocks()
            } else {
                document.getElementById("title").textContent = "Advanced"
                switchLoopBlockType()
            }

            if (this.value == "ezDisplay" || getBoard() == "ezDisplay") {
                document.getElementById("img2hex").classList.remove("hide")
                document.getElementById("compileButton").classList.add("hide")
            } else {
                document.getElementById("img2hex").classList.add("hide")
                document.getElementById("compileButton").classList.remove("hide")
            }

            onresize()
        }
    })

    clickTab(appState.selectedTabId)

    bindClick("newButton", newProject)
    bindClick("runButton", upload)
    bindClick("compileButton", compile)
    bindClick("img2hex", () => window.open("img2hex.html"))
    bindClick("saveButton", save)
    bindClick("editButton", editText)
    bindClick("monitorButton", usbSerial.connectUSB)
    bindClick("clearMonitor",
        function () {
            document.getElementById("content_monitor").textContent = ""
        },
    )
    bindClick("editorFontReset",
        function () {
            // do not specify the actual default here, defer to Code.getAceFontSize
            localStorage.removeItem("aceFontSize")
            appState.aceObj.setFontSize(getAceFontSize())
        })
    bindClick("editorFontUp",
        function () {
            appState.aceObj.setFontSize(appState.aceObj.getOption("fontSize") + 1)
            localStorage.setItem("aceFontSize", appState.aceObj.getOption("fontSize"))
        },
    )
    bindClick("editorFontDown",
        function () {
            appState.aceObj.setFontSize(appState.aceObj.getOption("fontSize") - 1)
            localStorage.setItem("aceFontSize", appState.aceObj.getOption("fontSize"))
        },
    )

    // Disable the link button if page isn't backed by App Engine storage.
    const linkButton = document.getElementById("linkButton")
    if ("BlocklyStorage" in window) {
        BlocklyStorage["HTTPREQUEST_ERROR"] = STRINGS["httpRequestError"]
        BlocklyStorage["LINK_ALERT"] = STRINGS["linkAlert"]
        BlocklyStorage["HASH_ERROR"] = STRINGS["hashError"]
        BlocklyStorage["XML_ERROR"] = STRINGS["xmlError"]
        bindClick(linkButton, () => BlocklyStorage.link(appState.workspace))
    } else if (linkButton) {
        linkButton.className = "disabled"
    }

    for (const [, tabId] of TABS) {
        bindClick("tab_" + tabId, () => clickTab(tabId))
    }
    bindClick("tab_code", function (e) {
        if (e.target !== document.getElementById("tab_code")) {
            // Prevent clicks on child codeMenu from triggering a tab click.
            return
        }
        changeCodingLanguage()
    })

    onresize()
    Blockly.svgResize(appState.workspace)

    // old init loadxml();
    initEditor()

    // prepare for variable types
    const varTypes = [
        ["Int", "Int"],
        ["Long", "Long"],
        ["Float", "Float"],
        ["Boolean", "Boolean"],
        ["String", "String"],
    ]
    appState.workspace.registerToolboxCategoryCallback("CREATE_TYPED_VARIABLE", createFlyout)
    const typedVarModal = new TypedVariableModal(appState.workspace, "callbackName", varTypes)
    typedVarModal.init()
}

export function createFlyout(workspace) {
    let xmlList = []
    // Add your button and give it a callback name.
    const button = document.createElement("button")
    button.setAttribute("text", "Create Typed Variable")
    button.setAttribute("callbackKey", "callbackName")

    xmlList.push(button)

    // This gets all the variables that the user creates and adds them to the
    // flyout.
    const blockList = Blockly.VariablesDynamic.flyoutCategoryBlocks(workspace)
    xmlList = xmlList.concat(blockList)
    return xmlList
}

export function buildToolbox() {
    // Construct the toolbox XML, replacing translated variable names.
    let toolboxText = document.getElementById(`${getLesson()}_toolbox`).outerHTML
    toolboxText = toolboxText.replace(/(^|[^%]){(\w+)}/g, (_m, p1, p2) => p1 + STRINGS[p2])
    return new DOMParser().parseFromString(toolboxText, "text/xml").documentElement
}

/**
 * Test for Serial Support
 */
export function initSerial() {
    if (!("serial" in navigator)) {
        // Get the modal
        let modal = document.getElementById("notSupported")
        modal.style.display = "block"

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = "none"
            }
        }
    }
}

/**
 * Initialize the page language.
 */
export function initLanguage() {
    // Set the HTML's language and direction.
    document.dir = isRtl() ? "rtl" : "ltr"
    document.head.parentElement.setAttribute("lang", appState.LANG)

    // Sort languages alphabetically.
    const languages = []
    for (const lang in LANGUAGE_NAME) {
        languages.push([LANGUAGE_NAME[lang], lang])
    }
    languages.sort((a, b) => {
        // Sort based on first argument ('English', 'Русский', '简体字', etc).
        if (a[0] > b[0]) return 1
        if (a[0] < b[0]) return -1
        return 0
    })
    // Populate the language selection menu.
    const languageMenu = document.getElementById("languageMenu")
    languageMenu.options.length = 0
    for (const tuple of languages) {
        const lang = tuple.at(-1)
        const option = new Option(...tuple)
        if (lang == appState.LANG) {
            option.selected = true
        }
        languageMenu.options.add(option)
    }
    languageMenu.addEventListener("change", changeLanguage, true)

    // Populate the coding language selection menu.
    const codeMenu = document.getElementById("code_menu")
    codeMenu.options.length = 0
    for (const [displayName, tabId] of TABS.slice(1)) {
        codeMenu.options.add(new Option(displayName, tabId))
    }

    codeMenu.addEventListener("change", changeCodingLanguage)

    // Inject language strings.
    document.title += " " + STRINGS["title"]
    document.getElementById("title").textContent = getLesson() || document.getElementById("lessonSelect").value// MSG['title'];
    if (getLesson() == "bot") {
        document.getElementById("title").textContent = "bot"
    } else {
        document.getElementById("title").textContent = "advanced"
    }
    document.getElementById("board").textContent = document.getElementById("boardSelect").value// MSG['title'];
    document.getElementById("tab_blocks").textContent = STRINGS["blocks"]

    document.getElementById("linkButton").title = STRINGS["linkTooltip"] // Blockly.Msg.LOAD_XML)
    document.getElementById("runButton").title = STRINGS["runTooltip"]
    document.getElementById("newButton").title = STRINGS["trashTooltip"]
}

export function initSelects() {
    if (localStorage.getItem("board")) {
        document.getElementById("boardSelect").value = getBoard()
    }
    if (localStorage.getItem("lesson")) {
        document.getElementById("lessonSelect").value = getLesson()
    }
}

export function getINO() {
    if (appState.selectedTabId == "blocks" && checkForBlockRoots() && checkAllGeneratorFunctionsDefined(arduinoGenerator)) {
        return arduinoGenerator.workspaceToCode()
    }
    // return document.getElementById("content_arduino").value;
    return appState.aceObj.getValue()
}

/**
 * Send code to server for hex
 *
 */
export async function compileAndMaybeUpload(shouldUpload = false) {
    const code = getINO()

    const board = getBoard()

    if (shouldUpload && board == "ezDisplay") {
        alert("Uploading is not implemented for ezDisplay.")
        return
    }

    if (getEditorType() == "blocks") {
        if ((getLesson() == "ezDisplay") != (board == "ezDisplay")) {
            alert("You must use both the ezDisplay board and lesson, not only one or the other.")
            return
        }
    }

    const boardFQBN = {
        uno: "arduino:avr:uno",
        nano: "arduino:avr:nano:cpu=atmega328",
        ezDisplay: "ATTinyCore:avr:attinyx5",
        wemos: "esp8266:esp8266:d1",
    }?.[board]

    if (!boardFQBN) {
        alert("Invalid board.")
        return
    }

    const feedbackManager = new CompileUploadFeedbackManager()
    feedbackManager.appendLog("Compiling (don't leave the tab)...\n")

    const resp = await fetch(COMPILE_URL + "/compile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ sketch: code, board: boardFQBN }),
    }).then(response => response.json())

    if (!resp.success) {
        console.warn(0, resp.msg, true)
        // can only run below if arduino compile error I can still get response with garbage body
        if (resp.stderr.length > 0) {
            const message = resp.stderr.replace(/\/tmp\/chromeduino|waca-(.*?)\/chromeduino|waca-(.*?)\.ino:/ig, "")
            console.error(message)
            feedbackManager.setState("reject")
            feedbackManager.appendLog(message)
            const rowcol = message.match(/\d+:\d+/g)
            const row = rowcol[0].substring(0, rowcol[0].indexOf(":"))
            appState.aceObj.gotoLine(row)
        }
        return
    }

    const { hex: bytecodeBase64, stdout } = resp
    if (!bytecodeBase64) {
        // what?!
        return
    }

    if (!shouldUpload) {
        console.log("HEX:", bytecodeBase64)
        feedbackManager.setState("resolve")
        feedbackManager.appendLog("Compiled!\n")
        feedbackManager.appendLog(stdout)
        return
    }

    feedbackManager.appendLog("Compiled, select port above!\n")
    feedbackManager.setState("uploading")

    try {
        if (["nano, uno"].includes(board)) {
            const avrgirl = new AvrgirlArduino({
                board: board,
                debug: true,
            })

            try {
                avrgirl.flash(new TextEncoder().encode(atob(bytecodeBase64)).buffer, (error) => {
                    // gear.classList.remove('spinning');
                    // progress.textContent = "done!";
                    if (error) {
                        console.error("Flash ERROR:", error)
                        // typicall wrong board
                        // avrgirl.connection.serialPort.close();
                        feedbackManager.setState("reject")
                        feedbackManager.appendLog(error + "\n" + stdout)
                    } else {
                        console.info("done correctly.")
                        feedbackManager.setState("resolve")
                        feedbackManager.appendLog(stdout)
                    }
                })
            } catch (err) {
                console.error(err)
            }
        } else if (board == "wemos") {
            const portFilters = [{ usbVendorId: 0x0403, usbProductId: 0x6001 }]
            const device = await navigator.serial.requestPort({ filters: portFilters })
            const transport = new Transport(device, true)

            const loaderOptions = {
                transport,
                baudrate: 115200,
                terminal: {
                    clean() {

                    },
                    writeLine(data) {
                        feedbackManager.appendLog(`${data}\n`)
                    },
                    write(data) {
                        feedbackManager.appendLog(data)
                    },
                },
                enableTracing: true,
                romBaudrate: 115200,
                // debugLogging: true,
            }

            const esploader = new ESPLoader(loaderOptions)
            await esploader.main()
            // await esploader.flashId()

            const flashOptions = {
                fileArray: [{ data: atob(bytecodeBase64), address: 0x0000 }],
                flashSize: "keep",
                eraseAll: false,
                compress: true,
                calculateMD5Hash: image => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString(),
            }

            await esploader.eraseFlash()
            await esploader.writeFlash(flashOptions)
            // await esploader.hardReset()

            await device.close()
            feedbackManager.setState("resolve")
        }
    } catch (error) {
        console.error("UPLOAD ERROR:", error)
        feedbackManager.setState("reject")
        feedbackManager.appendLog(error)
    }
}

export function upload() {
    if (getINO().includes("void setup")) {
        compileAndMaybeUpload(true)
    } else {
        Blockly.dialog.alert(`Missing setup() and/or loop(); ${appState.selectedTabId == "blocks" ? "try adding a starting block" : "implement these and try again"}.`)
    }
}

export function compile() {
    if (getINO().includes("void setup")) {
        compileAndMaybeUpload(false)
    } else {
        let msg = "Before we Compile be sure to add some primary functions."
        if (appState.selectedTabId == "blocks") {
            msg += "\nTry adding a starting block"
        } else {
            msg += "\nYou need at least a void setup() {} call to compile."
        }
        Blockly.dialog.alert(msg)
    }
}

export function switchLoopBlockType() {
    const blocks = appState.workspace.getBlocksByType("controls_loop")

    if (blocks.length == 1) {
        let racerLoop = appState.workspace.newBlock("controls_setup")
        racerLoop.initSvg()
        racerLoop.render()

        const botloop = appState.workspace.getBlocksByType("controls_loop")[0]
        const content = botloop.getInputTargetBlock("LOOP")

        botloop.getInput("LOOP").connection.disconnect()

        const chcon = content.previousConnection
        const racerConnection = racerLoop.getInput("LOOP").connection
        racerConnection.connect(chcon)

        botloop.dispose()
        appState.workspace.centerOnBlock(racerLoop.id)
    }
}

class CompileUploadFeedbackManager {
    responseElem = document.getElementById("response")
    iconElem = document.querySelector("#response span")
    logElem = document.querySelector("#response pre")

    constructor() {
        document.getElementById("arduinoOutput").style.display = "block"
        this.iconElem.textContent = ""
        this.logElem.textContent = ""
        this.setState("compiling")
    }

    setState(state) {
        this.setIcon(state)

        switch (state) {
            case "compiling":
                break
            case "uploading":
                break
            case "resolve":
                break
            case "reject":
                break
        }
    }

    setIcon(state) {
        this.iconElem.textContent = ""

        let color
        let iconType

        switch (state) {
            case "compiling":
            case "uploading":
                color = "yellow"
                iconType = "hourglass_empty"
                break
            case "resolve":
                color = "green"
                iconType = "check_circle"
                break
            case "reject":
                color = "red"
                iconType = "error"
                break
        }

        this.iconElem.textContent = iconType
        this.iconElem.style = `color: ${color};`
    }

    appendLog(content) {
        this.logElem.textContent += stripAnsi(content.toString())
    }
}

/**
 *
 * @param {string} msg
 * @param {boolean} success
 */

function showCompileUploadResult(msg, success = true) {
    let icon = ""
    let output = ""
    if (success) {
        icon = "<i class=\"material-icons\" style=\"font-size:48px;color:green\">check_circle</i>"
    } else {
        icon = "<i class=\"material-icons\" style=\"font-size:48px;color:red\">error</i>"
    }
    output = `<pre>${stripAnsi(msg)}</pre>`
    document.getElementById("response").innerHTML = icon + output
    document.getElementById("arduinoOutput").style.display = "block"
}

export function newProject() {
    const editor = getEditorType()
    if (editor == "blocks") {
        discardBlocks()
        renderContent()
    } else {
        const defaultCode = `void setup() {

}

void loop() {

}
`

        document.getElementById("content_arduino").value = defaultCode
        appState.aceObj.setValue(defaultCode)
    }
}

/**
 * Save blocks to local file.
 * better include Blob and FileSaver for browser compatibility
 */
export function save() {
    let data = ""
    let defaultName = "myBlocks"
    let fileType = "text/xml"
    let extension = ".xml"

    let editor = getEditorType()
    if (editor == "blocks") {
        const xml = Blockly.Xml.workspaceToDom(appState.workspace)
        data = Blockly.Xml.domToText(xml)
    } else {
        data = appState.aceObj.getValue()
        defaultName = "mySketch"
        fileType = "text/plain;charset=utf-8"
        extension = ".ino"
    }

    const fileName = window.prompt("What would you like to name your file?", defaultName)

    // Store data in blob.
    // var builder = new BlobBuilder();
    // builder.append(data);
    // saveAs(builder.getBlob('text/plain;charset=utf-8'), 'blockduino.xml');
    if (fileName) {
        const blob = new Blob([data], { type: fileType })
        saveAs(blob, fileName + extension)
    }
}

/**
 * Save blocks to local file.
 * better include Blob and FileSaver for browser compatibility
 */
export function editText() {
    const editButton = document.getElementById("editButton")
    const textarea = document.getElementById("content_arduino")
    const blocksTab = document.getElementById("tab_blocks")// className = 'taboff hide';
    // const arduinoTab = document.getElementById('tab_arduino');//className = 'taboff hide';
    let editor = getEditorType()

    // onresize();
    if (editor == "blocks") {
        setEditor()
        editButton.innerHTML = "BLOCK CODE"
        blocksTab.classList.add("hide")
        textarea.readOnly = false
        appState.aceObj.setReadOnly(false)
        // arduinoTab.classList.toggle("hide");
        clickTab("editor")
    } else if (confirm("Going back to blocks will remove any custom edits\nDo you wish to continue?")) {
        setEditor()
        editButton.innerHTML = "TEXT CODE"
        blocksTab.classList.remove("hide")
        // arduinoTab.classList.toggle("hide");
        textarea.readOnly = true
        appState.aceObj.setReadOnly(true)
        clickTab("blocks")
    }
}

export function initEditor() {
    document.getElementById("content_editor").style.fontSize = "14px"

    if (getEditorType() == "editor") {
        document.getElementById("editButton").innerHTML = "BLOCK CODE"
        document.getElementById("tab_blocks").classList.add("hide")
        document.getElementById("content_arduino").readOnly = false
        appState.aceObj.setReadOnly(false)
        clickTab("editor")
        if (getLesson() != "ezDisplay" || getBoard() != "ezDisplay") {
            document.getElementById("img2hex").classList.add("hide")
            document.getElementById("compileButton").classList.remove("hide")
        }
    } else {
        document.getElementById("editButton").innerHTML = "TEXT CODE"
        document.getElementById("content_arduino").readOnly = true
        appState.aceObj.setReadOnly(true)
    }

    appState.aceObj.setFontSize(getAceFontSize())
}

/**
 * Discard all blocks from the workspace.
 */
export function discardBlocks() {
    const count = appState.workspace.getAllBlocks(false).length
    if (count < 2 || window.confirm(Blockly.Msg["DELETE_ALL_BLOCKS"].replace("%1", count))) {
        appState.workspace.clear()
        if (window.location.hash) {
            window.location.hash = ""
        }
    }
}

// Load the Code demo's language strings.
// document.write('<script src="./js/lang/msg/' + Code.LANG + '.js"></script>\n');
// Load Blockly's language strings.
// document.write('<script src="./js/lang/' + Code.LANG + '.js"></script>\n');
// document.write("<script src=\"./msg/js/" + code.LANG + ".js\"></script>\n")

window.addEventListener("load", init)

const componentStyles = {
    workspaceBackgroundColour: "#aaa",
    toolboxBackgroundColour: "#333",
    toolboxForegroundColour: "#fff",
    flyoutBackgroundColour: "#222",
    flyoutForegroundColour: "#555",
    flyoutOpacity: 0.2,
    scrollbarColour: "#797979",
    insertionMarkerColour: "#fff",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: "#d0d0d0",
}

const fontStyle = {
    // "family": "Georgia, serif",
    // "weight": "bold",
    size: 12,
}

const sampleColours = {
    colourPrimary: "#4a148c",
    colourSecondary: "#AD7BE9",
    colourTertiary: "#CDB6E9",
}

const blockStyles = {
    list_blocks: sampleColours,
    // "logic_blocks": {
    //   "colourPrimary": "#01579b",
    //   "colourSecondary": "#64C7FF",
    //   "colourTertiary": "#C5EAFF"
    // },
    operators_blocks: { colourPrimary: "#759749" },
    math_blocks: { colourPrimary: "#759749" },
    procedure_blocks: { colourPrimary: 60 },
    control_blocks: { colourPrimary: 60 },
    logic_blocks: { colourPrimary: "#ffa555" },
    loop_blocks: { colourPrimary: 60 },
    ezDisplay_blocks: { colourPrimary: "#530b77" },
}

const categoryStyles = {
    controls: { colour: "#ffff00" },
    tests: { colour: "#ffa555" },
    math: { colour: "#759749" },
    variables: { colour: "#fff" },
    constants: { colour: "#efa199" },
    comm: { colour: "#fff" },
    lights: { colour: "#00ce00" },
    sounds: { colour: "#ff6900" },
    motors: { colour: 240 },
    sensors: { colour: 180 },
    ezDisplay: { colour: "#530b77" },
}

Blockly.Themes.Barnabas = Blockly.Theme.defineTheme("barnabas", {
    base: Blockly.Themes.Classic,
    componentStyles: componentStyles,
    blockStyles: blockStyles,
    categoryStyles: categoryStyles,
    fontStyle: fontStyle,
    startHats: true,
})

export function close(parentModal) {
    document.getElementById(parentModal).style.display = "none"
}

document.querySelectorAll("#notSupported .class").forEach(e => e.addEventListener("click", () => close("notSupported")))
document.querySelectorAll("#arduinoOutput .closeText").forEach(e => e.addEventListener("click", () => close("arduinoOutput")))

// const getMethods = (obj) => {
//   let properties = new Set();
//   let currentObj = obj;
//   do {
//     Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
//   } while ((currentObj = Object.getPrototypeOf(currentObj)));
//   return [...properties.keys()].filter(item => typeof obj[item] === 'function');
// };

// console.log(getMethods(Blockly.Variables))

const STRINGS = {
    title: "Code",
    blocks: "Blocks",
    linkTooltip: "Save and link to blocks.",
    runTooltip: "Run the program defined by the blocks in the workspace.",
    badCode: "Program error:\n%1",
    timeout: "Maximum execution iterations exceeded.",
    trashTooltip: "Discard all blocks.",
    listVariable: "list",
    textVariable: "text",
    httpRequestError: "There was a problem with the request.",
    linkAlert: "Share your blocks with this link:\n\n%1",
    hashError: "Sorry, '%1' doesn't correspond with any saved program.",
    xmlError: "Could not load your saved file. Perhaps it was created with a different version of Blockly?",
    badXml: "Error parsing XML:\n%1\n\nSelect 'OK' to abandon your changes or 'Cancel' to further edit the XML.",
}
