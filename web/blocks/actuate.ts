import * as Blockly from "blockly/core"

import imgLed from "../images/led.png"
import imgNoTone from "../images/notone.png"
import imgServo from "../images/servo.png"
import imgTone from "../images/tone.png"

export const blocks = [
    // led
    {
        type: "lights_led",
        message0: "LED %1 pin# %2 status %3",
        args0: [
            {
                type: "field_image",
                src: imgLed,
                width: 32,
                height: 32,
                alt: "Light Emitting Diode",
                flipRtl: false,
            },
            {
                type: "input_value",
                name: "PIN",
                value: 7,
                min: 0,
                max: 13,
                check: "Number",
            },
            {
                type: "input_value",
                name: "STATUS",
                check: "Boolean",
                align: "RIGHT",
            },
        ],
        inputsInline: false,
        previousStatement: true,
        nextStatement: true,
        colour: "#2dc32d",
        tooltip: "digitalWrite",
        helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/",
    },
    // tone
    {
        type: "sounds_tone",
        message0: "TONE %1 pin# %2 %3 freq %4",
        args0: [
            {
                type: "field_image",
                src: imgTone,
                width: 32,
                height: 32,
                alt: "Buzzer",
                flipRtl: false,
            },
            {
                type: "input_value",
                name: "PIN",
                value: 6,
                min: 0,
                max: 13,
            },
            {
                type: "input_dummy",
            },
            {
                type: "input_value",
                name: "FREQ",
                check: "Number",
                align: "RIGHT",
            },
        ],
        inputsInline: false,
        previousStatement: true,
        nextStatement: true,
        colour: "ec792d",
        tooltip: "tone",
        helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/tone/",
    },
    // noTone
    {
        type: "sounds_noTone",
        message0: "NO TONE %1 pin# %2",
        args0: [
            {
                type: "field_image",
                src: imgNoTone,
                width: 32,
                height: 32,
                alt: "No Buzzer",
                flipRtl: false,
            },
            {
                type: "input_value",
                name: "PIN",
                value: 6,
                min: 0,
                max: 13,
            },
        ],
        previousStatement: true,
        nextStatement: true,
        colour: "#ec792d",
        tooltip: "noTone",
        helpUrl: "https://www.arduino.cc/reference/en/language/functions/digital-io/noTone/",
    },
    // servo
    {
        type: "motors_servo",
        message0: "SERVO %1 pin# %2 angle %3",
        args0: [
            {
                type: "field_image",
                src: imgServo,
                width: 64,
                height: 64,
                alt: "Blue Motor",
                flipRtl: false,
            },
            {
                type: "input_value",
                name: "PIN",
                value: 6,
                min: 0,
                max: 13,
            },
            {
                type: "input_value",
                name: "DEGREE",
                check: "Number",
                align: "RIGHT",
                min: 0,
                max: 180,
            },
        ],
        inputsInline: false,
        previousStatement: true,
        nextStatement: true,
        colour: 230,
        tooltip: "Move between 0~180 degree",
        helpUrl: "http://www.arduino.cc/playground/ComponentLib/servo",
    },
    // DC Motor
    {
        type: "motors_dc",
        message0: "DC MOTOR %1 pin# %2 value %3",
        args0: [
            {
                type: "field_image",
                src: imgServo,
                width: 64,
                height: 64,
                alt: "Blue Motor",
                flipRtl: false,
            },
            {
                type: "input_value",
                name: "PIN",
                value: 0,
                min: 0,
                max: 6,
            },
            {
                type: "input_value",
                name: "VALUE",
                check: "Number",
                align: "RIGHT",
                min: 0,
                max: 255,
            },
        ],
        inputsInline: false,
        previousStatement: true,
        nextStatement: true,
        colour: 230,
        tooltip: "analogWrite",
        helpUrl: "http://www.arduino.cc/playground/ComponentLib/servo",
        extensions: ["test_max"],
    },
    {
        type: "led_builtin",
        message0: "builtin LED pin",
        output: "Number",
        colour: "#2dc32d",
        tooltip: "Pin number of the on-board LED.",
        helpUrl: "https://www.arduino.cc/reference/en/language/variables/constants/ledbuiltin/",
    },
]

Blockly.defineBlocksWithJsonArray(blocks)
