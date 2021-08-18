Blockly.Arduino.extra_logic = function (block) {
    if (block.getFieldValue("OP") === "XOR") {
        return ["!" + (Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_EQUALITY) || "false") + " != " + "!" + (Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_EQUALITY) || "false"), Blockly.Arduino.ORDER_EQUALITY]
    } else {
        return ["!" + (Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_EQUALITY) || "false") + " && " + "!" + (Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_EQUALITY) || "false"), Blockly.Arduino.ORDER_EQUALITY]
    }
};
Blockly.Arduino.logic_ternary = function (a) { var b = Blockly.Arduino.valueToCode(a, "IF", Blockly.Arduino.ORDER_CONDITIONAL) || "false", c = Blockly.Arduino.valueToCode(a, "THEN", Blockly.Arduino.ORDER_CONDITIONAL) || "null"; a = Blockly.Arduino.valueToCode(a, "ELSE", Blockly.Arduino.ORDER_CONDITIONAL) || "null"; return [b + " ? " + c + " : " + a, Blockly.Arduino.ORDER_CONDITIONAL] };
// base.js
Blockly.Arduino.pulsein = function () {
    var code;
    var value_pin = Blockly.Arduino.valueToCode(this, 'pin', Blockly.Arduino.ORDER_ATOMIC) || '0';
    var value_timeout = Blockly.Arduino.valueToCode(this, 'timeout', Blockly.Arduino.ORDER_ATOMIC) || '-1';
    var dropdown_type = (this.getFieldValue('type') == 'HIGH') ? 'HIGH' : 'LOW';
    console.log(value_timeout);
    if (value_timeout > 0) {
        code = 'pulseIn(' + value_pin + ', ' + dropdown_type + ', ' + value_timeout + ')';
    } else {
        code = 'pulseIn(' + value_pin + ', ' + dropdown_type + ')';
    }
    // TODO: Change ORDER_NONE to the correct strength.
    Blockly.Arduino.setups_['setup_output_' + value_pin] = 'pinMode(' + value_pin + ', INPUT);';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};
