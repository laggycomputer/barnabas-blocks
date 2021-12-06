/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Arduino for text blocks.
 * @author gasolin@gmail.com (Fred Lin)
 */
'use strict';

goog.provide('Blockly.Arduino.texts');

goog.require('Blockly.Arduino');


Blockly.Arduino['text'] = function (block) {
  // Text value.
  var code = Blockly.Arduino.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['text_commentout'] = function (block) {
  var branch = Blockly.Arduino.statementToCode(block, 'COMMENTOUT');
  var code;
  code = '/*\n' + branch + '\n*/\n';
  return code;
};

Blockly.Arduino['text_length'] = function (block) {
  // String length.
  var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE',
    Blockly.Arduino.ORDER_FUNCTION_CALL) || '\'\'';
  return [argument0 + '.length()', Blockly.Arduino.ORDER_MEMBER];
};

Blockly.Arduino['text_charAt'] = function (block) {
  var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || "";
  var index = Blockly.Arduino.valueToCode(block, 'INDEX', Blockly.Arduino.ORDER_ATOMIC) || 0;
  var code = argument0 + '.charAt(' + index + ')'
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};
