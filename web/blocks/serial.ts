import * as Blockly from "blockly/core"

export const blocks = [
    {
        type: "serial_print",
        helpUrl: Blockly.Msg.SERIAL_PRINT_HELPURL,
        colour: "#ccc",
        message0: "SERIAL print no line %1",
        args0: [
            {
                type: "input_value",
                name: "CONTENT",
                check: ["Number", "String"],
            },
        ],
        previousStatement: true,
        nextStatement: true,
        tooltip: Blockly.Msg.SERIAL_PRINT_TOOLTIP,
    },
    {
        type: "serial_println",
        helpUrl: Blockly.Msg.SERIAL_PRINTLN_HELPURL,
        colour: "#ccc",
        message0: "SERIAL print line %1",
        args0: [
            {
                type: "input_value",
                name: "CONTENT",
                check: ["Number", "String"],
            },
        ],
        previousStatement: true,
        nextStatement: true,
        tooltip: Blockly.Msg.SERIAL_PRINTLN_TOOLTIP,
    },
    {
        type: "serial_read",
        helpUrl: Blockly.Msg.SERIAL_READ_HELPURL,
        colour: "#ccc",
        message0: "Read one byte from serial",
        output: ["Number", "String"],
        tooltip: Blockly.Msg.SERIAL_READ_TOOLTIP,
    },
    {
        type: "serial_available",
        helpUrl: Blockly.Msg.SERIAL_AVAILABLE_HELPURL,
        colour: "#ccc",
        message0: "%1",
        output: "Boolean",
        tooltip: Blockly.Msg.SERIAL_AVAILABLE_TOOLTIP,
    },
]

Blockly.defineBlocksWithJsonArray(blocks)
