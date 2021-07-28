Blockly.Arduino.sandwich = function () { return "const int SANDWICH = 123123;\n" }
Blockly.Arduino.extra_logic = function (block) {
    // var operand = "XOR" == block.getFieldValue("OP") ? "&&" : "||";
    // var order = "&&" == b ? Blockly.Arduino.ORDER_LOGICAL_AND : Blockly.Arduino.ORDER_LOGICAL_OR;
    // var leftCode = Blockly.Arduino.valueToCode(block, "A", order) || "false";
    // var rightCode = Blockly.Arduino.valueToCode(block, "B", order) || "false";
    // return [leftCode + " " + operand + " " + rightCode, order]

    if (block.getFieldValue("OP") === "XOR") {
        return ["!" + (Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_EQUALITY) || "false") + " != " + "!" + (Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_EQUALITY) || "false"), Blockly.Arduino.ORDER_EQUALITY]
    } else {
        return ["!" + (Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_EQUALITY) || "false") + " && " + "!" + (Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_EQUALITY) || "false"), Blockly.Arduino.ORDER_EQUALITY]
    }
};
Blockly.Arduino.logic_ternary = function (a) { var b = Blockly.Arduino.valueToCode(a, "IF", Blockly.Arduino.ORDER_CONDITIONAL) || "false", c = Blockly.Arduino.valueToCode(a, "THEN", Blockly.Arduino.ORDER_CONDITIONAL) || "null"; a = Blockly.Arduino.valueToCode(a, "ELSE", Blockly.Arduino.ORDER_CONDITIONAL) || "null"; return [b + " ? " + c + " : " + a, Blockly.Arduino.ORDER_CONDITIONAL] };
Blockly.Arduino.pulse_in = function (block) {
    var listenPin = Blockly.Arduino.valueToCode(block, "PIN", Blockly.Arduino.ORDER_ATOMIC) || "4";
    Blockly.Arduino.setups_["setup_output_" + listenPin] = "pinMode(" + listenPin + ", INPUT);"
    var state = Blockly.Arduino.valueToCode(block, "STATE", Blockly.Arduino.ORDER_ATOMIC) || "HIGH";
    return ["pulseIn(" + listenPin + ", " + state + ");\n", Blockly.Arduino.ORDER_FUNCTION_CALL]
};
Blockly.Arduino.pulse_in_timeout = function (block) {
    var listenPin = Blockly.Arduino.valueToCode(block, "PIN", Blockly.Arduino.ORDER_ATOMIC) || "4";
    Blockly.Arduino.setups_["setup_output_" + listenPin] = "pinMode(" + listenPin + ", INPUT);"
    var state = Blockly.Arduino.valueToCode(block, "STATE", Blockly.Arduino.ORDER_ATOMIC) || "HIGH";
    var timeout = Blockly.Arduino.valueToCode(block, "TIMEOUT", Blockly.Arduino.ORDER_ATOMIC) || "4";
    return ["pulseIn(" + listenPin + ", " + state + ", " + timeout + ");\n", Blockly.Arduino.ORDER_FUNCTION_CALL]
};
