'use strict';

goog.provide('Blockly.Arduino.lights');

goog.require('Blockly.Arduino');

Blockly.Arduino['lights_led'] = function (block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '13'
    var stat = Blockly.Arduino.valueToCode(block, 'STATUS', Blockly.Arduino.ORDER_ATOMIC) || 'HIGH'
    if (pin > 0) {
        Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    }
    var code = 'digitalWrite(' + pin + ', ' + stat + ');\n'
    return code;
};
