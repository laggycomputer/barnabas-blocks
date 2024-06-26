import { ArduinoGenerator, Order } from "./arduinoGenerator"

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["controls_if"] = function (block, generator) {
        let bodyNum = 0

        let cond = generator.valueToCode(block, `IF${bodyNum}`, Order.ORDER_NONE) || "false"
        let branch = generator.statementToCode(block, `DO${bodyNum}`)
        let code = `if (${cond}) {\n${branch}}`

        const blockProps = block as unknown as Record<string, number>
        for (bodyNum = 1; bodyNum <= blockProps.elseifCount_; bodyNum++) {
            cond = generator.valueToCode(block, `IF${bodyNum}`, Order.ORDER_NONE) || "false"
            branch = generator.statementToCode(block, `DO${bodyNum}`)
            code += ` else if (${cond}) {\n${branch}}`
        }
        if (blockProps.generator) {
            branch = generator.statementToCode(block, "ELSE")
            code += ` else {\n${branch}}`
        }
        return code + "\n"
    }

    generator.forBlock["logic_compare"] = function (block, generator) {
        const op = {
            EQ: "==",
            NEQ: "!=",
            LT: "<",
            LTE: "<=",
            GT: ">",
            GTE: ">=",
        }[block.getFieldValue("OP") as string]

        const order = ["==", "!="].includes(op) ? Order.ORDER_EQUALITY : Order.ORDER_RELATIONAL

        const left = generator.valueToCode(block, "A", order) || "0"
        const right = generator.valueToCode(block, "B", order) || "0"

        return [`${left} ${op} ${right}`, order]
    }

    generator.forBlock["logic_operation"] = function (block, generator) {
        const op = {
            AND: "&&",
            OR: "||",
        }[block.getFieldValue("OP") as string]
        const order = {
            AND: Order.ORDER_LOGICAL_AND,
            OR: Order.ORDER_LOGICAL_OR,
        }[block.getFieldValue("OP") as string]

        const left = generator.valueToCode(block, "A", order) || "false"
        const right = generator.valueToCode(block, "B", order) || "false"

        return [`${left} ${op} ${right}`, order]
    }

    generator.forBlock["logic_negate"] = function (block, generator) {
        return [`!${generator.valueToCode(block, "BOOL", Order.ORDER_UNARY_PREFIX)}`, Order.ORDER_UNARY_PREFIX]
    }

    generator.forBlock["logic_boolean"] = function (block) {
        return [{
            TRUE: "true",
            FALSE: "false",
        }[block.getFieldValue("BOOL") as string], Order.ORDER_ATOMIC]
    }

    generator.forBlock["logic_null"] = function () {
        return ["NULL", Order.ORDER_ATOMIC]
    }

    generator.forBlock["extra_logic"] = function (block, generator) {
        const op = {
            XOR: "!=",
            NOR: "&&",
        }[block.getFieldValue("OP") as string]

        const order = {
            XOR: Order.ORDER_EQUALITY,
            NOR: Order.ORDER_LOGICAL_AND,
        }[block.getFieldValue("OP") as string]

        const lhs = generator.valueToCode(block, "LEFT", Order.ORDER_UNARY_PREFIX) || "false"
        const rhs = generator.valueToCode(block, "RIGHT", Order.ORDER_UNARY_PREFIX) || "false"

        return [`!${lhs} ${op} !${rhs}`, order]
    }

    generator.forBlock["logic_ternary"] = function (block, generator) {
        const cond = generator.valueToCode(block, "IF", Order.ORDER_CONDITIONAL) || "false"
        const then = generator.valueToCode(block, "THEN", Order.ORDER_CONDITIONAL) || "null"
        const else_ = generator.valueToCode(block, "ELSE", Order.ORDER_CONDITIONAL) || "null"

        return `${cond} ? ${then} : ${else_}`
    }
}
