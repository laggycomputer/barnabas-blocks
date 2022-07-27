'use strict';

goog.provide('Blockly.Arduino.sounds');

goog.require('Blockly.Arduino');

Blockly.Arduino['sounds_tone'] = function (block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 6;
    var freq = Blockly.Arduino.valueToCode(block, 'FREQ', Blockly.Arduino.ORDER_ATOMIC) || '440';
    if (pin > 0) {
        Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    }
    var code = 'tone(' + pin + ',' + freq + ');\n';
    return code;
};

Blockly.Arduino['sounds_noTone'] = function (block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 6;
    // var pin = block.getFieldValue('PIN');
    if (pin > 0) {
        Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    }
    var code = 'noTone(' + pin + ');\n';
    return code;
};