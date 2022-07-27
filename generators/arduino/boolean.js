'use strict';

goog.provide('Blockly.Arduino.boolean');

goog.require('Blockly.Arduino');

Blockly.Arduino['boolean_onoff'] = function (block) {
    // Boolean values HIGH and LOW.
    // Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) 
    var code = (block.getFieldValue('BOOL') == 'HIGH') ? 'HIGH' : 'LOW';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['boolean_hilo'] = function (block) {
    var code = (block.getFieldValue('BOOL') == 'HIGH') ? 'HIGH' : 'LOW';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['boolean_pressed'] = Blockly.Arduino['boolean_onoff'];

Blockly.Arduino['boolean_button'] = function (block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
    if (pin > 0) {
        Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    }
    var code = 'digitalRead('+ pin +')';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};