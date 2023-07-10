Blockly.Arduino.extra_logic = function (block) {
    if (block.getFieldValue("OP") === "XOR") {
        return ["!" + (Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_EQUALITY) || "false") + " != " + "!" + (Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_EQUALITY) || "false"), Blockly.Arduino.ORDER_EQUALITY]
    } else {
        return ["!" + (Blockly.Arduino.valueToCode(block, "A", Blockly.Arduino.ORDER_EQUALITY) || "false") + " && " + "!" + (Blockly.Arduino.valueToCode(block, "B", Blockly.Arduino.ORDER_EQUALITY) || "false"), Blockly.Arduino.ORDER_EQUALITY]
    }
};

Blockly.Arduino.boolean_button = function (block) {
    let pin = (block.getFieldValue("PIN") || "2").toString();
    0 < pin && (Blockly.Arduino.setups_["setup_output_" + pin] = "pinMode(" + pin + ", INPUT_PULLUP);");
    return ["digitalRead(" + pin + ")", Blockly.Arduino.ORDER_ATOMIC]
};

Blockly.Arduino.logic_ternary = function (a) { var b = Blockly.Arduino.valueToCode(a, "IF", Blockly.Arduino.ORDER_CONDITIONAL) || "false", c = Blockly.Arduino.valueToCode(a, "THEN", Blockly.Arduino.ORDER_CONDITIONAL) || "null"; a = Blockly.Arduino.valueToCode(a, "ELSE", Blockly.Arduino.ORDER_CONDITIONAL) || "null"; return [b + " ? " + c + " : " + a, Blockly.Arduino.ORDER_CONDITIONAL] };
// base.js
Blockly.Arduino.pulsein = function () {
    var code;
    var value_pin = Blockly.Arduino.valueToCode(this, 'pin', Blockly.Arduino.ORDER_ATOMIC) || '0';
    var value_timeout = Blockly.Arduino.valueToCode(this, 'timeout', Blockly.Arduino.ORDER_ATOMIC) || '-1';
    var dropdown_type = (this.getFieldValue('type') == 'HIGH') ? 'HIGH' : 'LOW';
    console.log(value_timeout);
    if (value_timeout > 0) {
        code = 'pulseIn(' + value_pin + ', ' + dropdown_type + ', ' + value_timeout + ')';
    } else {
        code = 'pulseIn(' + value_pin + ', ' + dropdown_type + ')';
    }
    // TODO: Change ORDER_NONE to the correct strength.
    Blockly.Arduino.setups_['setup_output_' + value_pin] = 'pinMode(' + value_pin + ', INPUT);';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.analog_pin = function (block) {
    const pin = Blockly.Arduino.valueToCode(block, "PIN", Blockly.Arduino.ORDER_ATOMIC) || "A0";

    return [`${pin}`, Blockly.Arduino.ORDER_FUNCTION_CALL]
}

Blockly.Arduino.analog_read = function (block) {
    const pin = block.getFieldValue("PIN", Blockly.Arduino.ORDER_ATOMIC) || "A0";

    Blockly.Arduino.setups_["setup_input_" + pin] = `pinMode(${pin}, INPUT);`;
    return [`analogRead(${pin})`, Blockly.Arduino.ORDER_FUNCTION_CALL]
}

Blockly.Arduino.sensors_sonic = function (block) {
    const echoPin = Blockly.Arduino.valueToCode(block, "ECHO", Blockly.Arduino.ORDER_ATOMIC) || "3";
    const triggerPin = Blockly.Arduino.valueToCode(block, "TRIGGER", Blockly.Arduino.ORDER_ATOMIC) || "4";
    Blockly.Arduino.setups_["setup_output_" + triggerPin] = `pinMode(${triggerPin}, OUTPUT);`;
    Blockly.Arduino.setups_["setup_output_" + echoPin] = `pinMode(${echoPin}, INPUT);`;
    Blockly.Arduino.definitions_.define_Sonic_Timing = `
long ultrasonic() {
  digitalWrite(${triggerPin}, LOW);
  delayMicroseconds(5);
  digitalWrite(${triggerPin}, HIGH);
  delayMicroseconds(10);
  digitalWrite(${triggerPin}, LOW);
  float duration_ms = pulseIn(${echoPin}, HIGH);
  float duration = duration_ms / 1000000;
  float distance_meters = (343 * duration) / 2;
  float distance_cm = distance_meters * 100;
  return distance_cm;
}\n`;
    return ["ultrasonic()", Blockly.Arduino.ORDER_FUNCTION_CALL]
};

Blockly.Arduino.SSD1306_clear = function () {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    return "oled.clear();\n"
}

Blockly.Arduino.SSD1306_print = function (block) {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    let contentCode = Blockly.Arduino.valueToCode(block, "CONTENT", Blockly.Arduino.ORDER_ATOMIC)

    return "oled.print(" + contentCode + ");\n"
}

Blockly.Arduino.SSD1306_scroll = function (block) {
    let contentCode = Blockly.Arduino.valueToCode(block, "CONTENT", Blockly.Arduino.ORDER_ATOMIC)
    var direction = block.getFieldValue("TEST")

    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\nconst char textToScrollData[] PROGMEM = {" + contentCode + "};\nDATACUTE_F_MACRO_T * textToScroll = FPSTR(textToScrollData);\n\nuint16_t nextRowOfTextToDraw;\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\noled.setFont(FONT8X16);\noled.setCursor(5, 1);\noled.clipText(0, 118, textToScroll);\nnextRowOfTextToDraw = 118;\n\noled.on();\n"

    return ""+direction+"\nif (nextRowOfTextToDraw >= (sizeof(textToScrollData) - 1) * 8) {\n   nextRowOfTextToDraw = 0;\n}\ndelay(20);\n"
}

Blockly.Arduino.SSD1306_scrollup = function (block) {
    let contentCode = Blockly.Arduino.valueToCode(block, "CONTENT", Blockly.Arduino.ORDER_ATOMIC)
    var str = new String(contentCode);
    var substr = str.substring(0, str.length - 1);
    var string1 = substr.slice(0, 20).replace(/\\/g, '')+'"';
    var string2 = '"'+ substr.slice(20, 40).replace(/\\/g, '')+'"';
    var string3 = '"'+ substr.slice(40, 60).replace(/\\/g, '')+'"';
    var string4 = '"'+ substr.slice(60, 80).replace(/\\/g, '')+'"';
    var string5 = '"'+ substr.slice(80, 100).replace(/\\/g, '')+'"';
    var string6 = '"'+ substr.slice(100, 120).replace(/\\/g, '')+'"';
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\noled.setFont(FONT6X8);\noled.clear();\noled.switchRenderFrame();\noled.clear();\noled.switchRenderFrame();\n\noled.setCursor(0,1);\noled.print(F("+ string1 +"));\noled.setCursor(0,2);\noled.print(F("+ string2 +"));\noled.setCursor(0,3);\noled.print(F("+ string3 +"));\noled.setCursor(0,4);\noled.print(F("+ string4 +"));\noled.setCursor(0,5);\noled.print(F("+ string5 +"));\noled.setCursor(0,6);\noled.print(F("+ string6 +"));\n\noled.setCursor(0,7);\noled.startData();\nfor (uint8_t i = 0; i < 16; i++) {\n  oled.sendData(0x02);\noled.sendData(0x02);\noled.sendData(0x02);\noled.sendData(0x0C);\noled.sendData(0x10);\noled.sendData(0x10);\noled.sendData(0x10);\noled.sendData(0x0C);\n}\noled.endData();\n\noled.scrollLeftOffset(7,1,7,1);\n\noled.setVerticalScrollArea(4, 60);\noled.activateScroll();\noled.on();";

    return ""
}

Blockly.Arduino.SSD1306_font = function (block) {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    // this lookup was generated by manually copying the array names, automatically listing the files available
    // in the fonts library, and matching them. discrepancies may be due to human error. -laggycomputer
    font_to_include_map = {
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
        "FONTZXPIX": "zxpix_font.h"
    }

    let font = block.getFieldValue("FONT")

    // is the font built-in? if not, import the fonts too:
    if (!["FONT8X16", "FONT6X8"].includes(font)) {
        let resolved_include = font_to_include_map[font];
        Blockly.Arduino.definitions_["define_" + font] = "#include <" + resolved_include + ">\n"
    }

    return [font, Blockly.Arduino.ORDER_ATOMIC]
}

Blockly.Arduino.SSD1306_set_font = function (block) {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    let contentCode = Blockly.Arduino.valueToCode(block, "FONT", Blockly.Arduino.ORDER_ATOMIC)

    return "oled.setFont(" + contentCode + ");\n"
}

Blockly.Arduino.SSD1306_set_cursor = function (block) {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    let xCode = Blockly.Arduino.valueToCode(block, "X", Blockly.Arduino.ORDER_ATOMIC)
    let yCode = Blockly.Arduino.valueToCode(block, "Y", Blockly.Arduino.ORDER_ATOMIC)

    return "oled.setCursor(" + xCode + ", " + yCode + ");\n"
}

Blockly.Arduino.SSD1306_print_image = function (block) {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    function chunk(str, size) {
        if (typeof str === 'string') {
            const length = str.length
            const chunks = new Array(Math.ceil(length / size))
            for (let i = 0, index = 0; index < length; i++) {
                chunks[i] = str.slice(index, index += size)
            }
            return chunks
        }
    }

    let hex = Blockly.Arduino.valueToCode(block, "CONTENT", Blockly.Arduino.ORDER_ATOMIC)
    while (hex.includes("\"")) {
        hex = hex.replace("\"", "")
    }

    const validChars = Array.from(new Array(16)).map((_e, i) => i.toString(16))
    hex = hex.split().filter(c => validChars.includes(c.toLowerCase())).join("")

    const hashed = md5(hex).slice(0, 16)

    const chunks = chunk(hex, 16 * 2).map(c => {
        const asBytes = chunk(c, 2).map(b => "0x" + b)
        return "  " + asBytes.join(", ")
    })

    definition = `const char bitmap_${hashed} [] PROGMEM = {\n${chunks.join(",\n")}\n}\n`

    Blockly.Arduino.definitions_["define_" + hashed] = definition

    const x = Blockly.Arduino.valueToCode(block, "X", Blockly.Arduino.ORDER_ATOMIC)
    const y = Blockly.Arduino.valueToCode(block, "Y", Blockly.Arduino.ORDER_ATOMIC)
    const w = Blockly.Arduino.valueToCode(block, "W", Blockly.Arduino.ORDER_ATOMIC)
    const h = Blockly.Arduino.valueToCode(block, "H", Blockly.Arduino.ORDER_ATOMIC)

    return `oled.drawImage(bitmap_${hashed}, ${x}, ${y}, ${w}, ${h});\n`
};

Blockly.Arduino.SSD1306_framebuffer_render = function () {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    return "oled.switchRenderFrame();\n"
};

Blockly.Arduino.SSD1306_framebuffer_display = function () {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"
    
    return "oled.switchDisplayFrame();\n"
};

Blockly.Arduino.SSD1306_framebuffer_both = function () {
    Blockly.Arduino.definitions_.define_Tiny4K = "#include <Wire.h>\n#define TINY4KOLED_QUICK_BEGIN\n#include <Tiny4kOLED.h>\n";
    Blockly.Arduino.setups_.setup_SSD1306 = "oled.begin();\n"

    return "oled.switchFrame();\n"
};
