'use strict';

goog.provide('Blockly.Arduino.sensors');

goog.require('Blockly.Arduino');

Blockly.Arduino['sensors_button'] = function (block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
    var stat = Blockly.Arduino.valueToCode(block, 'STATUS', Blockly.Arduino.ORDER_ATOMIC) || 'HIGH';
    if ((pin) > 0) {
        Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', INPUT);';
    }
    var code = 'digitalRead(' + pin + ', ' + stat + ');\n';
    return code;
};

Blockly.Arduino['sensors_sonic'] = function (block) {
    var echo_pin = Blockly.Arduino.valueToCode(block, 'ECHO', Blockly.Arduino.ORDER_ATOMIC) || '3';
    var trig_pin = Blockly.Arduino.valueToCode(block, 'TRIGGER', Blockly.Arduino.ORDER_ATOMIC) || '4';
    var reset_pin = Blockly.Arduino.valueToCode(block, 'RESET', Blockly.Arduino.ORDER_ATOMIC) || '0';

    Blockly.Arduino.definitions_['define_sonic_timeout'] = 'int Sonic_Time_out = 3000;\n';
    Blockly.Arduino.setups_['setup_output_' + trig_pin] = 'pinMode(' + trig_pin + ', OUTPUT);';
    Blockly.Arduino.setups_['setup_output_' + echo_pin] = 'pinMode(' + echo_pin + ', INPUT);';
    Blockly.Arduino.setups_['setup_output_' + reset_pin] = 'pinMode(' + reset_pin + ', OUTPUT);';

    Blockly.Arduino.definitions_['define_Sonic_Timing'] = 'long Sonic_Timing(){\n' +
        "  digitalWrite(" + trig_pin + ", LOW);\n" +
        "  delayMicroseconds(2);\n" +
        "  digitalWrite(" + trig_pin + ", HIGH);\n" +
        "  delayMicroseconds(10);\n" +
        "  digitalWrite(" + trig_pin + ", LOW);\n" +
        "  long duration = pulseIn(" + echo_pin + ",HIGH,Sonic_Time_out);\n" +
        "  if ( duration == 0 ){\n" +
        "    duration = Sonic_Time_out;\n" +
        "    digitalWrite(" + reset_pin + ", HIGH);\n" +
        "    delay(25);\n" +
        "    digitalWrite(" + reset_pin + " ,LOW);\n" +
        "    delay(225);\n" +
        "  }\n" +
        "  return duration;\n" +
        "}\n";

    var code = '';
    return code;
};