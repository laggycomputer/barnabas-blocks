'use strict';

goog.provide('Blockly.Arduino.controls');

goog.require('Blockly.Arduino');

Blockly.Arduino['controls_wait'] = function (block) {
  var delay_time = Math.round(Blockly.Arduino.valueToCode(block, 'DELAY_TIME', Blockly.Arduino.ORDER_ATOMIC) * 1000);
  var code = 'delay(' + delay_time + ');\n';
  return code;
};

Blockly.Arduino['controls_repeat_times'] = function (block) {
  // Repeat n times (internal number).
  var repeats = Blockly.Arduino.valueToCode(block, 'TIMES', Blockly.Arduino.ORDER_ATOMIC);
  var branch = Blockly.Arduino.statementToCode(block, 'DO');
  branch = Blockly.Arduino.addLoopTrap(branch, block.id);
  var loopvar = Blockly.Arduino.variableDB_.getDistinctName(
    'count', Blockly.Variables.NAME_TYPE);
  var code = 'for (int ' + loopvar + ' = 0; ' +
    loopvar + ' < ' + repeats + '; ' +
    loopvar + '++) {\n' +
    branch + '}\n';
  return code;
};

Blockly.Arduino['controls_setup'] = function (block) {
  var statements_setup = Blockly.Arduino.statementToCode(block, 'SETUP');
  var statements_loop = Blockly.Arduino.statementToCode(block, 'LOOP');

  Blockly.Arduino.setups_['setup'] = statements_setup;
  Blockly.Arduino.loop_ = statements_loop;

  var code = statements_loop;  // ''; // switch to empty 
  return '// any code not in a loop ';
};

Blockly.Arduino['controls_delay'] = function (block) {
  var delay_time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME', Blockly.Arduino.ORDER_ATOMIC) || '1000'
  var code = 'delay(' + delay_time + ');\n';
  return code;
};

Blockly.Arduino['controls_loop'] = function (block) {
  var statements_loop = Blockly.Arduino.statementToCode(block, 'LOOP');

  Blockly.Arduino.loop_ = statements_loop;
  return '';
}