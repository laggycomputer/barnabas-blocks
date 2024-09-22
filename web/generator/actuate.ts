import { ArduinoGenerator, Order } from "./arduinoGenerator"

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["lights_led"] = function (block, generator) {
        const pin = generator.valueToCode(block, "PIN", Order.ORDER_ATOMIC)
        const status = generator.valueToCode(block, "STATUS", Order.ORDER_ATOMIC)
        generator.reservePin(block, pin, "output", "LED")

        generator.addSetup(block, `led:${pin}`, `pinMode(${pin}, OUTPUT);`)

        return `digitalWrite(${pin}, ${status});\n`
    }

    generator.forBlock["sounds_tone"] = function (block, generator) {
        const pin = generator.valueToCode(block, "PIN", Order.ORDER_ATOMIC) || "6"
        const freq = generator.valueToCode(block, "FREQ", Order.ORDER_ATOMIC) || "440"
        generator.reservePin(block, pin, "output", "buzzer")

        generator.addSetup(block, `buzzer:${pin}`, `pinMode(${pin}, OUTPUT);`)

        return `tone(${pin}, ${freq});\n`
    }

    generator.forBlock["sounds_noTone"] = function (block, generator) {
        const pin = generator.valueToCode(block, "PIN", Order.ORDER_ATOMIC) || "6"
        generator.reservePin(block, pin, "output", "buzzer")

        generator.addSetup(block, `buzzer:${pin}`, `pinMode(${pin}, OUTPUT);`)

        return `noTone(${pin});\n`
    }

    generator.forBlock["motors_servo"] = function (block, generator) {
        generator.addInclude(block, "servo", "#include <Servo.h>")

        const pin = generator.valueToCode(block, "PIN", Order.ORDER_ATOMIC) || "5"
        generator.reservePin(block, pin, "output", "servo")

        const angle = generator.valueToCode(block, "DEGREE", Order.ORDER_ATOMIC) || "90"

        const servoVarName = `servo_${pin}`
        generator.addDeclaration(block, `servo_${pin}`, `Servo ${servoVarName};`)
        generator.addSetup(block, `servo:attach:${pin}`, `${servoVarName}.attach(${pin});`)

        return `${servoVarName}.write(${angle});\n`
    }

    generator.forBlock["motors_dc"] = function (block, generator) {
        const pin = generator.valueToCode(block, "PIN", Order.ORDER_ATOMIC) || "11"
        generator.reservePin(block, pin, "output", "DC motor")
        const value = generator.valueToCode(block, "VALUE", Order.ORDER_ATOMIC) || "255"

        return `analogWrite(${pin}, ${value});\n`
    }

    generator.forBlock["led_builtin"] = function () {
        return ["LED_BUILTIN", Order.ORDER_ATOMIC]
    }
}
