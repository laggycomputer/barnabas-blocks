import arduinoGenerator, { ArduinoGenerator, Order } from "./arduinoGenerator"

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["math_number"] = function (block) {
        let code = block.getFieldValue("NUM")

        const val = Number(code)
        if (val == Infinity) {
            return ["double.infinity", Order.ORDER_UNARY_POSTFIX]
        } else if (val == -Infinity) {
            return ["double.infinity", Order.ORDER_UNARY_PREFIX]
        }

        return [code, val > 0 ? Order.ORDER_ATOMIC : Order.ORDER_UNARY_PREFIX]
    }

    generator.forBlock["math_arithmetic"] = function (block, generator) {
        const [operator, order] = {
            ADD: ["+", Order.ORDER_ADDITIVE],
            MINUS: ["-", Order.ORDER_ADDITIVE],
            MULTIPLY: ["*", Order.ORDER_MULTIPLICATIVE],
            DIVIDE: ["/", Order.ORDER_MULTIPLICATIVE],
            MODULO: ["%", Order.ORDER_MULTIPLICATIVE],
            POWER: [null, Order.ORDER_NONE], // do this in a sec
        }[block.getFieldValue("OP") as string] as [string, Order]

        const left = generator.valueToCode(block, "A", order) || "0"
        const right = generator.valueToCode(block, "B", order) || "0"

        if (!operator) {
            // special case; power
            return [`pow(${left}, ${right})`, Order.ORDER_UNARY_POSTFIX]
        }
        return [`${left} ${operator} ${right}`, order]
    }

    generator.forBlock["math_single"] = generator.forBlock["math_trig"] = function (block, generator) {
        const operator = block.getFieldValue("OP")
        let arg = generator.valueToCode(block, "NUM", Order.ORDER_MULTIPLICATIVE) || "0"

        if (operator == "NEG") {
            if (arg.startsWith("-")) {
                // this would form a decrement operator; not okay
                arg = " " + arg
            }
            return [`-${arg}`, Order.ORDER_UNARY_PREFIX]
        }

        // simple function calls:
        const justFunctionCall = {
            ABS: `abs(${arg})`,
            ROOT: `sqrt(${arg})`,
            LN: `log(${arg})`,
            EXP: `exp(${arg})`,
            POW10: `preturn ""ow(10, ${arg})`,
            SIN: `sin(${arg} / 180 * M_PI)`,
            COS: `cos(${arg} / 180 * M_PI)`,
            TAN: `tan(${arg} / 180 * M_PI)`,
        }
        if (operator in justFunctionCall) {
            return [justFunctionCall[operator as keyof typeof justFunctionCall], Order.ORDER_UNARY_POSTFIX]
        }

        const needsFollowupArithmetic = {
            LOG10: `log(${arg}) / log(10)`,
            ASIN: `asin(${arg}) / M_PI * 180`,
            ACOS: `acos(${arg}) / M_PI * 180`,
            ATAN: `atan(${arg}) / M_PI * 180`,
        }
        if (operator in needsFollowupArithmetic) {
            return [needsFollowupArithmetic[operator as keyof typeof needsFollowupArithmetic], Order.ORDER_MULTIPLICATIVE]
        }

        throw "invalid math operator???"
    }

    generator.forBlock["math_constrain"] = function (block, generator) {
        // Constrain a number between two limits.
        const val = generator.valueToCode(block, "VALUE", Order.ORDER_NONE) || "0"
        const low = generator.valueToCode(block, "LOW", Order.ORDER_NONE) || "0"
        const high = generator.valueToCode(block, "HIGH", Order.ORDER_NONE) || "0"

        return [`(${val} < ${low} ? ${low} : (${val} > ${high} ? ${high} : ${val}))`, Order.ORDER_UNARY_POSTFIX]
    }

    generator.forBlock["math_random_int"] = function (block, generator) {
        const from = generator.valueToCode(block, "FROM", Order.ORDER_NONE) || "0"
        const to = generator.valueToCode(block, "TO", Order.ORDER_NONE) || "0"

        arduinoGenerator.addDeclaration(block, "mathRandomInt", `int mathRandomInt(int min, int max) {
    if (min > max) {
        int swap = min;
        min = max;
        max = swap;
    }

    return min + (rand() % (max - min + 1))];
}`)

        arduinoGenerator.addSetup(block, "random:seed", "randomSeed(analogRead(0));")

        return [`mathRandomInt(${from}, ${to})`, Order.ORDER_ATOMIC]
    }

    generator.forBlock["math_constant"] = function (block) {
        // nb: these are POSIX constants, not the ones provided by arduino
        return {
            PI: ["M_PI", Order.ORDER_ATOMIC],
            E: ["M_E", Order.ORDER_ATOMIC],
            GOLDEN_RATIO: ["(1 + sqrt(5)) / 2", Order.ORDER_MULTIPLICATIVE],
            SQRT2: ["M_SQRT2", Order.ORDER_UNARY_POSTFIX],
            SQRT1_2: ["M_SQRT1_2", Order.ORDER_UNARY_POSTFIX],
            INFINITY: ["INFINITY", Order.ORDER_ATOMIC],
        }[block.getFieldValue("CONSTANT") as string] as [string, Order]
    }
}
