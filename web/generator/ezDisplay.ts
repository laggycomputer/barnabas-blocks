import { Block } from "blockly/core"

import { ArduinoGenerator, Order } from "./arduinoGenerator"
import { MD5 } from "crypto-js"

function ezDisplaySetup(block: Block, generator: ArduinoGenerator) {
    generator.addInclude(block, "Tiny4k", "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n")
    generator.addSetup(block, "SSD1306", "oled.begin();")
}

export default function populate(generator: ArduinoGenerator) {
    generator.forBlock["SSD1306_clear"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        return "oled.clear();\n"
    }

    generator.forBlock["SSD1306_print"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        const content = generator.valueToCode(block, "CONTENT", Order.ORDER_ATOMIC) || ""
        return `oled.print(${content});\n`
    }

    generator.forBlock["SSD1306_scroll"] = function (block, generator) {
        ezDisplaySetup(block, generator)
        generator.addSetup(block, "ezDisplayScrolling", `
oled.setFont(FONT8X16);
oled.setCursor(5, 1);
oled.clipText(0, 118, textToScroll);
nextRowOfTextToDraw = 118;
oled.on();
`)

        const text = generator.valueToCode(block, "CONTENT", Order.ORDER_ATOMIC)
        generator.addDeclaration(block, "ezDisplayScrollText", `const char textToScrollData[] PROGMEM = {${text}};
DATACUTE_F_MACRO_T* textToScroll = FPSTR(textToScrollData);
uint16_t nextRowOfTextToDraw;`)

        const direction = block.getFieldValue("DIRECTION")
        return `${direction}
if (nextRowOfTextToDraw >= (sizeof(textToScrollData) - 1) * 8) {
  nextRowOfTextToDraw = 0;
}
delay(20);
`
    }

    generator.forBlock["SSD1306_font"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        const font = block.getFieldValue("FONT")
        if (!["FONT8X16", "FONT6X8"].includes(font)) {
            const includeMap = {
                "FONT5X5": "5x5_font.h",
                "FONT7LINEDIGITAL": "7linedigital_font.h",
                "FONTACME5OUTLINES": "acme_5_outlines_font.h",
                "FONTAZTECH": "aztech_font.h",
                "FONTBLOKUS": "Blokus_font.h",
                "FONTBMPLAIN": "BMplain_font.h",
                "FONTBMSPA": "BMSPA_font.h",
                "&cp_437_box_drawing_font": "boxyfont.h",
                "FONTBUBBLESSTANDARD": "bubblesstandard_font.h",
                "FONTCOMMOMONOSPACED": "Commo-Monospaced_font.h",
                "FONTCRACKERS": "crackers_font.h",
                "FONT8X16ATARI": "font8x16atari.h",
                "FONT11X16": "font11x16.h",
                "&ssd1306xled_font16x16cn": "font16x16cn.h",
                "FONT16X32DIGITS": "font16x32digits.h",
                "FONTFORMPLEX12": "formplex12_font.h",
                "FONTHAIKU": "haiku_font.h",
                "FONTHISKYF21": "HISKYF21_font.h",
                "FONTHOMESPUN": "homespun_font.h",
                "FONTHUNTER": "HUNTER_font.h",
                "FONTM38": "m38_font.h",
                "FONTMINIMUM": "Minimum_font.h",
                "FONTMINIMUM1": "Minimum+1_font.h",
                "FONT8X16MDOS": "ModernDos.h",
                "FONT8X8MDOS": "ModernDos8.h",
                "FONT8X16PO": "PixelOperator.h",
                "FONT8X16POB": "PixelOperatorBold.h",
                "FONTPZIM3X5": "pzim3x5_font.h",
                "FONTRAUMSOND": "Raumsond_font.h",
                "FONTRENEW": "renew_font.h",
                "FONTSLOTH": "sloth_font.h",
                "FONTSUPERDIG": "SUPERDIG_font.h",
                "FONTTAMAMINI02": "tama_mini02_font.h",
                "FONTZXPIX": "zxpix_font.h",
            }

            generator.addInclude(block, `font:${font}`, `#include <${includeMap[font as keyof typeof includeMap]}>`)
        }

        return [font, Order.ORDER_ATOMIC]
    }

    generator.forBlock["SSD1306_set_font"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        return `oled.setFont(${generator.valueToCode(block, "FONT", Order.ORDER_ATOMIC)});\n`
    }

    generator.forBlock["SSD1306_set_cursor"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        const x = generator.valueToCode(block, "X", Order.ORDER_ATOMIC)
        const y = generator.valueToCode(block, "Y", Order.ORDER_ATOMIC)
        return `oled.setCursor(${x}, ${y});\n`
    }

    generator.forBlock["SSD1306_print_image"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        const hex = generator.valueToCode(block, "CONTENT", Order.ORDER_COMMA)
        const bytes = new ArrayBuffer(hex.length / 2)
        const view = new Uint8Array(bytes)
        for (let byte = 0; byte < hex.length / 2; byte++) {
            view[byte] = parseInt(hex.slice(byte * 2, byte * 2 + 2), 16)
        }

        const hash = MD5(view.toString())
        // 128 pixels or 128 / 8 = 16 bytes
        const chunkSize = 16
        const chunks = []
        for (let offset = 0; offset < view.length; offset += chunkSize) {
            chunks.push(view.slice(offset, chunkSize))
        }

        generator.addDeclaration(block, `ezDisplay_image:${hash}`, `const char bitmap_${hash} [] PROGMEM = {\n\t${chunks.join(",\n\t")}\n}\n`)

        const x = generator.valueToCode(block, "X", Order.ORDER_COMMA)
        const y = generator.valueToCode(block, "Y", Order.ORDER_COMMA)
        const w = generator.valueToCode(block, "W", Order.ORDER_COMMA)
        const h = generator.valueToCode(block, "H", Order.ORDER_COMMA)

        return `oled.drawImage(bitmap_${hash}, ${x}, ${y}, ${w}, ${h});\n`
    }

    generator.forBlock["SSD1306_framebuffer_switch_working"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        return "oled.switchRenderFrame();\n"
    }

    generator.forBlock["SSD1306_framebuffer_switch_displayed"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        return "oled.switchDisplayFrame();\n"
    }

    generator.forBlock["SSD1306_framebuffer_switch_both"] = function (block, generator) {
        ezDisplaySetup(block, generator)

        return "oled.switchFrame();\n"
    }
}
