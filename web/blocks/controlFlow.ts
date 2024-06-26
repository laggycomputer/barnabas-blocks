import * as Blockly from "blockly/core"

export const blocks = [
    // wait
    {
        type: "controls_wait",
        message0: "WAIT seconds %1",
        args0: [
            {
                type: "input_value",
                name: "DELAY_TIME",
                check: "Number",
                align: "CENTRE",
            },
        ],
        previousStatement: true,
        nextStatement: true,
        colour: 60,
        tooltip: "delay",
        helpUrl: "https://www.arduino.cc/reference/en/language/functions/time/delay/",
    },
    // repeat
    {
        type: "controls_repeat_times",
        message0: "%{BKY_CONTROLS_REPEAT_TITLE}",
        args0: [
            {
                type: "input_value",
                name: "TIMES",
                check: "Number",
            },
        ],
        message1: "%{BKY_CONTROLS_REPEAT_INPUT_DO} %1",
        args1: [
            {
                type: "input_statement",
                name: "DO",
            },
        ],
        previousStatement: true,
        nextStatement: true,
        colour: 64,
        tooltip: "%{BKY_CONTROLS_REPEAT_TOOLTIP}",
        helpUrl: "%{BKY_CONTROLS_REPEAT_HELPURL}",
    },
    // program
    {
        type: "controls_setup",
        message0: "PROGRAM %1 void setup ( ) %2 void loop ( ) %3",
        args0: [
            {
                type: "input_dummy",
            },
            {
                type: "input_statement",
                name: "SETUP",
            },
            {
                type: "input_statement",
                name: "LOOP",
            },
        ],
        colour: 60,
        tooltip: "",
        helpUrl: "https://www.arduino.cc/reference/en/#stucture",
    },
    // loop do
    {
        type: "controls_loop",
        message0: "LOOP %1 do %2",
        args0: [
            {
                type: "input_dummy",
            },
            {
                type: "input_statement",
                name: "LOOP",
            },
        ],
        colour: 60,
        tooltip: "",
        helpUrl: "https://www.arduino.cc/reference/en/#stucture",
    },
    {
        type: "controls_delay",
        message0: "delay %1",
        args0: [
            {
                type: "input_value",
                name: "DELAY_TIME",
                check: "Number",
            },
        ],
        previousStatement: true,
        nextStatement: true,
        colour: 60,
        tooltip: "Pause instruction for specific time",
        helpUrl: "http://arduino.cc/en/Reference/delay",
    },
]

Blockly.Blocks["extra_logic"] = {
    /**
   * Block for logical operations: "xor", "nor".
   * @this Blockly.Block
   */
    init: function () {
        const OPERATORS = [["XOR", "XOR"], ["NOR", "NOR"]] as [string, string][]
        this.setHelpUrl(Blockly.Msg.LOGIC_OPERATION_HELPURL)
        this.setColour("#ffa555")
        this.setOutput(true, "Boolean")
        this.appendValueInput("LEFT")
            .setCheck("Boolean")
        this.appendValueInput("RIGHT")
            .setCheck("Boolean")
            .appendField(new Blockly.FieldDropdown(OPERATORS), "OP")
        this.setInputsInline(true)
        this.setTooltip(() => {
            return {
                XOR: "eXclusive OR - true only if inputs differ",
                NOR: "neither NOR - true only if both inputs are false",
            }[this.getFieldValue("OP") as "XOR" | "NOR"]
        })
    },
}

Blockly.defineBlocksWithJsonArray(blocks)
