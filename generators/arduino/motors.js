'use strict';

goog.provide('Blockly.Arduino.motors');

goog.require('Blockly.Arduino');

Blockly.Arduino['motors_servo'] = function (block) {
    var dropdown_pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 9;
    var value_degree = Blockly.Arduino.valueToCode(block, 'DEGREE', Blockly.Arduino.ORDER_ATOMIC) || 180;
    //value_degree = value_degree.replace('(','').replace(')','')

    Blockly.Arduino.definitions_['define_servo'] = '#include <Servo.h>\n';
    Blockly.Arduino.definitions_['var_servo' + dropdown_pin] = 'Servo servo_' + dropdown_pin + ';\n';
    Blockly.Arduino.setups_['setup_servo_' + dropdown_pin] = 'servo_' + dropdown_pin + '.attach(' + dropdown_pin + ');\n';

    var code = 'servo_' + dropdown_pin + '.write(' + value_degree + ');\n';
    return code;
};

Blockly.Arduino['motors_dc'] = function(block) {
    var dropdown_pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 11;
    var value_num = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '255'
    var code = 'analogWrite(' + dropdown_pin + ', ' + value_num + ');\n';
    return code;
  };
  