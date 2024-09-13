import { Names } from "blockly"
import { ArduinoGenerator, Order } from "./arduinoGenerator"

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["variables_get"] = generator.forBlock["variables_get_dynamic"] = function (block) {
        const varName = generator.nameDB_?.getName(block.getFieldValue("VAR"), Names.NameType.VARIABLE)
        return [varName, Order.ORDER_ATOMIC]
    }

    generator.forBlock["variables_set"] = generator.forBlock["variables_set_dynamic"] = function (block) {
        const varName = generator.nameDB_?.getName(block.getFieldValue("VAR"), Names.NameType.VARIABLE)
        const value = generator.valueToCode(block, "VALUE", Order.ORDER_ASSIGNMENT) || "0"

        return `${varName} = ${value};\n`
    }
}
