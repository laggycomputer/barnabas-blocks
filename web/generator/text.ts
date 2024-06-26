import { ArduinoGenerator, Order } from "./arduinoGenerator"

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["text"] = function (block, generator) {
        return [generator.quote_(block.getFieldValue("TEXT")), Order.ORDER_ATOMIC]
    }

    generator.forBlock["text_commentout"] = function (block, generator) {
        return `/*
${generator.statementToCode(block, "COMMENTOUT")}
*/\n`
    }

    generator.forBlock["text_length"] = function (block) {
        return [(generator.valueToCode(block, "VALUE", Order.ORDER_FUNCTION_CALL) || "''") + ".length()", Order.ORDER_MEMBER]
    }
}
