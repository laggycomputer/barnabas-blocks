/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Arduino for dynamic variable blocks.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

goog.provide('Blockly.Arduino.variablesDynamic');

goog.require('Blockly.Arduino');
goog.require('Blockly.Arduino.variables');


// Arduino is dynamically typed.
Blockly.Arduino['variables_get_dynamic'] = Blockly.Arduino['variables_get'];
Blockly.Arduino['variables_set_dynamic'] = Blockly.Arduino['variables_set'];
