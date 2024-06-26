import { Block } from "blockly"
import { ArduinoGenerator, Order, profile } from "./arduinoGenerator"

function serialSetup(block: Block, generator: ArduinoGenerator) {
    generator.addSetup(block, "serial", `Serial.begin(${profile.arduino.serialBaud});`)
}

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["serial_print"] = function (block) {
        serialSetup(block, generator)

        return `Serial.print(${generator.valueToCode(block, "CONTENT", Order.ORDER_ATOMIC) || "\"\""});\n`
    }

    generator.forBlock["serial_read"] = function (block) {
        serialSetup(block, generator)

        return ["Serial.read()", Order.ORDER_ATOMIC]
    }

    // generator.forBlock["serial_byte_number"] = function (block) {
    //     return [block.getFieldValue("NUM"), Order.ORDER_ATOMIC]
    // }

    generator.forBlock["serial_available"] = function (block) {
        serialSetup(block, generator)

        return ["Serial.available()", Order.ORDER_ATOMIC]
    }

    generator.forBlock["serial_println"] = function (block) {
        serialSetup(block, generator)

        return `Serial.println(${generator.valueToCode(block, "CONTENT", Order.ORDER_ATOMIC) || "\"\""});\n`
    }
}
