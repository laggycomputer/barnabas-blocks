'use strict';

// goog.provide('Blockly.Arduino.initializes');

// goog.require('Blockly.Arduino');

Blockly.Arduino['controls_wait'] = function (block) {
  let delay_time = Math.round(Blockly.Arduino.valueToCode(block, 'DELAY_TIME', Blockly.Arduino.ORDER_ATOMIC) * 1000);
  let code = 'delay(' + delay_time + ');\n';
  return code;
};

Blockly.Arduino['controls_repeat_times'] = function (block) {
  // Repeat n times (internal number).
  let repeats = Blockly.Arduino.valueToCode(block, 'TIMES', Blockly.Arduino.ORDER_ATOMIC);
  let branch = Blockly.Arduino.statementToCode(block, 'DO');
  branch = Blockly.Arduino.addLoopTrap(branch, block.id);
  let looplet = Blockly.Arduino.variableDB_.getDistinctName(
    'count', Blockly.Variables.NAME_TYPE);
  let code = 'for (int ' + looplet + ' = 0; ' +
    looplet + ' < ' + repeats + '; ' +
    looplet + '++) {\n' +
    branch + '}\n';
  return code;
};

Blockly.Arduino['controls_setup'] = function (block) {
  let statements_setup = Blockly.Arduino.statementToCode(block, 'SETUP');
  let statements_loop = Blockly.Arduino.statementToCode(block, 'LOOP');

  Blockly.Arduino.setups_['setup'] = statements_setup;
  Blockly.Arduino.loop_ = statements_loop;

  let code = statements_loop;  // ''; // switch to empty 
  return '// any code not in a loop ';
};

Blockly.Arduino['controls_delay'] = function (block) {
  let delay_time = Blockly.Arduino.valueToCode(this, 'DELAY_TIME', Blockly.Arduino.ORDER_ATOMIC) || '1000'
  let code = 'delay(' + delay_time + ');\n';
  return code;
};

Blockly.Arduino['controls_loop'] = function (block) {
  let statements_loop = Blockly.Arduino.statementToCode(block, 'LOOP');
  Blockly.Arduino.loop_ = statements_loop;
  return '';
}

Blockly.Arduino['controls_if'] = function() {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.Arduino.valueToCode(this, 'IF' + n,
      Blockly.Arduino.ORDER_NONE);
  var branch = Blockly.Arduino.statementToCode(this, 'DO' + n);
  // console.log(argument);
  // if (argument === 'undefined' || argument === '') return Blockly.alert("Missing Test");
  var code = 'if (' + argument + ') {\n' + branch + '\n}';
  for (n = 1; n <= this.elseifCount_; n++) {
    argument = Blockly.Arduino.valueToCode(this, 'IF' + n,
      Blockly.Arduino.ORDER_NONE) || 'false';
    branch = Blockly.Arduino.statementToCode(this, 'DO' + n);
    code += ' else if (' + argument + ') {\n' + branch + '}';
  }
  if (this.elseCount_) {
    branch = Blockly.Arduino.statementToCode(this, 'ELSE');
    code += ' else {\n' + branch + '\n}';
  }
  return code + '\n';
};

Blockly.Arduino['boolean_onoff'] = function (block) {
  // Boolean values HIGH and LOW.
  // Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) 
  let code = (block.getFieldValue('BOOL') == 'HIGH') ? 'HIGH' : 'LOW';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['boolean_hilo'] = function (block) {
  let code = (block.getFieldValue('BOOL') == 'HIGH') ? 'HIGH' : 'LOW';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['boolean_pressed'] = function (block) {
  let code = (block.getFieldValue('BOOL') == 'HIGH') ? 'HIGH' : 'LOW';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['lights_led'] = function (block) {
  let pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '13'
  let stat = Blockly.Arduino.valueToCode(block, 'STATUS', Blockly.Arduino.ORDER_ATOMIC) || 'HIGH'
  if (pin > 0) {
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
  }
  let code = 'digitalWrite(' + pin + ', ' + stat + ');\n'
  return code;
};

Blockly.Arduino['sounds_tone'] = function (block) {
  // set up ?

  let pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 6;
  let freq = Blockly.Arduino.valueToCode(block, 'FREQ', Blockly.Arduino.ORDER_ATOMIC) || '440';
  if (pin > 0) {
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
  }
  let code = 'tone(' + pin + ',' + freq + ');\n';
  return code;
};

Blockly.Arduino['sounds_noTone'] = function (block) {
  let pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 6;
  // let pin = block.getFieldValue('PIN');
  if (pin > 0) {
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
  }
  let code = 'noTone(' + pin + ');\n';
  return code;
};

Blockly.Arduino['motors_servo'] = function (block) {
  let dropdown_pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 9;
  let value_degree = Blockly.Arduino.valueToCode(block, 'DEGREE', Blockly.Arduino.ORDER_ATOMIC) || 180;
  //value_degree = value_degree.replace('(','').replace(')','')

  Blockly.Arduino.definitions_['define_servo'] = '#include <Servo.h>\n';
  Blockly.Arduino.definitions_['var_servo' + dropdown_pin] = 'Servo servo_' + dropdown_pin + ';\n';
  Blockly.Arduino.setups_['setup_servo_' + dropdown_pin] = 'servo_' + dropdown_pin + '.attach(' + dropdown_pin + ');\n';

  let code = 'servo_' + dropdown_pin + '.write(' + value_degree + ');\n';
  return code;
};

Blockly.Arduino['sensors_button'] = function (block) {
  let pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
  let stat = Blockly.Arduino.valueToCode(block, 'STATUS', Blockly.Arduino.ORDER_ATOMIC) || 'HIGH';
  if ((pin) > 0) {
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
  }
  let code = 'digitalRead(' + pin + ')== ' + stat ;
  return code;
};

Blockly.Arduino['sensors_sonic'] = function (block) {
  let echo_pin = Blockly.Arduino.valueToCode(block, 'ECHO', Blockly.Arduino.ORDER_ATOMIC) || '3';
  let trig_pin = Blockly.Arduino.valueToCode(block, 'TRIGGER', Blockly.Arduino.ORDER_ATOMIC) || '4';
  let reset_pin = Blockly.Arduino.valueToCode(block, 'RESET', Blockly.Arduino.ORDER_ATOMIC) || '0';

  Blockly.Arduino.definitions_['define_sonic_timeout'] = 'int Sonic_Time_out = 3000;\n';
  Blockly.Arduino.setups_['setup_output_' + trig_pin] = 'pinMode(' + trig_pin + ', OUTPUT);';
  Blockly.Arduino.setups_['setup_output_' + echo_pin] = 'pinMode(' + echo_pin + ', INPUT);';
  Blockly.Arduino.setups_['setup_output_' + reset_pin] = 'pinMode(' + reset_pin + ', OUTPUT);';

  Blockly.Arduino.definitions_['define_Sonic_Timing'] = 'long Sonic_Timing(){\n'+
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
    "  }\n"+
    "  return duration;\n"+
    "}\n";

  let code = ``;
  return code;
};

Blockly.Arduino['base_map'] = function() {
  var value_num = Blockly.Arduino.valueToCode(this, 'NUM', Blockly.Arduino.ORDER_NONE);
  var value_dmax = Blockly.Arduino.valueToCode(this, 'DMAX', Blockly.Arduino.ORDER_ATOMIC);
  var code = 'map(' + value_num + ', 0, 1024, 0, ' + value_dmax + ')';
  return [code, Blockly.Arduino.ORDER_NONE];
};

Blockly.Arduino.serial_print = function() {
  var content = Blockly.Arduino.valueToCode(this, 'CONTENT', Blockly.Arduino.ORDER_ATOMIC) || '0'
  //content = content.replace('(','').replace(')','');  

  Blockly.Arduino.setups_['setup_serial_'+ profile.default.serial] = 'Serial.begin('+profile.default.serial+');\n';

  var code = 'Serial.print('+content+');\n';
  return code;
};

Blockly.Arduino.serial_read = function() {
  var content = Blockly.Arduino.valueToCode(this, 'CONTENT', Blockly.Arduino.ORDER_ATOMIC) || '0'
  //content = content.replace('(','').replace(')','');

  Blockly.Arduino.setups_['setup_serial_'+profile.default.serial] = 'Serial.begin('+profile.default.serial+');\n';

  var code = 'Serial.read()';
  return [code,Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.serial_byte_number = function() {
  var code = this.getFieldValue('NUM');

  return [code,Blockly.Arduino.ORDER_ATOMIC];
};


Blockly.Arduino.serial_available = function() {
  var content = Blockly.Arduino.valueToCode(this, 'CONTENT', Blockly.Arduino.ORDER_ATOMIC) || '0'
  //content = content.replace('(','').replace(')','');

  Blockly.Arduino.setups_['setup_serial_'+profile.default.serial] = 'Serial.begin('+profile.default.serial+');\n';

  var code = 'Serial.available()';
  return [code,Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.serial_println = function() {
  var content = Blockly.Arduino.valueToCode(this, 'CONTENT', Blockly.Arduino.ORDER_ATOMIC) || '0'
  //content = content.replace('(','').replace(')','');

  Blockly.Arduino.setups_['setup_serial_'+profile.default.serial] = 'Serial.begin('+profile.default.serial+');\n';

  var code = 'Serial.println('+content+');\n';
  return code;
};

Blockly.Arduino.text = function() {
  // Text value.
  var code = Blockly.Arduino.quote_(this.getFieldValue('TEXT'));
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};


Blockly.Arduino.procedures_defreturn = function() {
  // Define a procedure with a return value.
  var funcName = Blockly.Arduino.variableDB_.getName(this.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Arduino.statementToCode(this, 'STACK');
  if (Blockly.Arduino.INFINITE_LOOP_TRAP) {
    branch = Blockly.Arduino.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var returnValue = Blockly.Arduino.valueToCode(this, 'RETURN',
      Blockly.Arduino.ORDER_NONE) || '';
  var type = this.getFieldValue('TYPE');
  if (returnValue) {
    returnValue = '  return ' + returnValue + ';\n';
  }
  var returnType = returnValue ? type : 'void';
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Arduino.variableDB_.getName(this.arguments_[x],
        Blockly.Variables.NAME_TYPE);
  }
  var code = returnType + ' ' + funcName + '(' + args.join(', ') + ') {\n' +
      branch + returnValue + '}\n';
  code = Blockly.Arduino.scrub_(this, code);
  Blockly.Arduino.definitions_[funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Arduino.procedures_defnoreturn = Blockly.Arduino.procedures_defreturn;

Blockly.Arduino.procedures_callreturn = function() {
  // Call a procedure with a return value.
  var funcName = Blockly.Arduino.variableDB_.getName(this.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Arduino.valueToCode(this, 'ARG' + x,
        Blockly.Arduino.ORDER_NONE) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
};

Blockly.Arduino.procedures_callnoreturn = function() {
  // Call a procedure with no return value.
  var funcName = Blockly.Arduino.variableDB_.getName(this.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Arduino.valueToCode(this, 'ARG' + x,
        Blockly.Arduino.ORDER_NONE) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ');\n';
  return code;
};

Blockly.Arduino.procedures_ifreturn = function() {
  // Conditionally return value from a procedure.
  var condition = Blockly.Arduino.valueToCode(this, 'CONDITION',
      Blockly.Arduino.ORDER_NONE) || 'false';
  var code = 'if (' + condition + ') {\n';
  if (this.hasReturnValue_) {
    var value = Blockly.Arduino.valueToCode(this, 'VALUE',
        Blockly.Arduino.ORDER_NONE) || 'null';
    code += '  return ' + value + ';\n';
  } else {
    code += '  return;\n';
  }
  code += '}\n';
  return code;
};

Blockly.Arduino['variables_get'] = function(block) {
  // Variable getter.
  var code = Blockly.Arduino.variableDB_.getName(this.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

/*
Blockly.Arduino['variables_declare'] = function() {
  // Variable setter.
  var dropdown_type = this.getFieldValue('TYPE');
  //TODO: settype to variable
  var argument0 = Blockly.Arduino.valueToCode(this, 'VALUE',
      Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Arduino.variableDB_.getName(this.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  Blockly.Arduino.setups_['setup_var' + varName] = varName + ' = ' + argument0 + ';\n';
  return '';
};
*/

Blockly.Arduino['variables_rset'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE',
      Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Arduino.variableDB_.getName(this.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  var variables = Blockly.Variables.allVariablesAndTypes(this.workspace);
  var code;
  for (var x = 0; x < variables.length; x++) {
    if(variables[x][0] == varName && variables[x][1] == 'Array'){
      code = 'int ' + variables[x][0] + '[] = ' + argument0 + ';\n';
      //Blockly.Arduino.variableDB_.getName(variables[x],
      //Blockly.Variables.NAME_TYPE) + ';\n';
      Blockly.Arduino.definitions_[variables[x][0]] = code;
      return "";
    }
  }
  return varName + ' = ' + argument0 + ';\n';

};
Blockly.Arduino['variables_set'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE',
      Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Arduino.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
  return varName + ' = ' + argument0 + ';\n';
};