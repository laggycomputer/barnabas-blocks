import { Names } from "blockly"
import { ArduinoGenerator, Order } from "./arduinoGenerator"

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["procedures_defreturn"] = generator.forBlock["procedures_defnoreturn"] = function (block) {
        const funcName = generator.nameDB_?.getName(block.getFieldValue("NAME"), Names.NameType.PROCEDURE)
        let branch = generator.statementToCode(block, "STACK")
        if (generator.STATEMENT_PREFIX) {
            branch = generator.prefixLines(generator.STATEMENT_PREFIX.replace(/%1/g, `'${block.id}'`), generator.INDENT) + branch
        }
        if (generator.INFINITE_LOOP_TRAP) {
            branch = generator.INFINITE_LOOP_TRAP.replace(/%1/g, `'${block.id}'`) + branch
        }

        let returnValue = ""
        if (block.type == "procedures_defreturn") {
            returnValue = generator.valueToCode(block, "RETURN", Order.ORDER_NONE) || ""
            if (returnValue) {
                returnValue = `${this.INDENT}return ${returnValue};\n`
            }
        }

        const args_and_type = []
        const { arguments_ } = block as unknown as Record<string, string[]>
        for (let x = 0; x < arguments_.length; x++) {
            args_and_type[x] = `double ${generator.nameDB_?.getName(arguments_[x], Names.NameType.DEVELOPER_VARIABLE)}`
        }
        let returnType
        if (block.type == "procedures_defreturn") {
            const checks = block.getInput("RETURN")?.connection?.targetConnection?.getCheck()
            if (checks && checks[0]) {
                returnType = generator.TYPES[checks[0]]
            } else {
                returnType = "double"
            }
        } else {
            returnType = "void"
        }

        let code = `${returnType} ${funcName}(${args_and_type.join(", ")}) {
${branch}${returnValue}}`
        code = generator.scrub_(block, code)
        generator.addDeclaration(block, funcName, code, true)
        return null
    }

    generator.forBlock["procedures_callreturn"] = generator.forBlock["procedures_callnoreturn"] = function (block) {
        const funcName = generator.nameDB_?.getName(block.getFieldValue("NAME"), Names.NameType.PROCEDURE)

        const args = []
        const { arguments_ } = block as unknown as Record<string, string[]>
        for (let x = 0; x < arguments_.length; x++) {
            args[x] = generator.valueToCode(block, "ARG" + x, Order.ORDER_NONE) || "null"
        }

        if (block.type == "procedures_callreturn") {
            const code = `${funcName}(${args.join(", ")})`
            return [code, Order.ORDER_FUNCTION_CALL]
        } else {
            return `${funcName}(${args.join(", ")});\n`
        }
    }
}
