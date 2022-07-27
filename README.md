Barnabas Blocks
===============

Introduction
------------

Barnabas Blocks is derived from several open source projects based on Blockly, the web-based, graphical programming editor.
The core was started as a fork from [BlocklyDuino](https://github.com/makewitharduino/Online-BlocklyDuinoEditor) to provide language blocks and code generators for arduino programming and other elements have been added from [Chromeduino2](https://github.com/spaceneedle/Chromeduino/)

[Reference Document](https://docs.google.com/document/d/1Wo0LuB8NIk4ksWTbLzph6lmJyBPKhafwQRXbVBngGmY) about using this project with Chromeduino

### Features

* Programming Arduino with visually drag and drop code blocks
* Generate fully compatible Arduino source code
* Interactive Arduino board with 10+ predefined Grove sensor blocks
* Load different on-site examples with url parameters
* Theme choice.

### Demo

This is a web tool for teaching [Barnabas Robotics Curriculum](https://lessons.barnabasrobotics.com). You can give it a try at https://code.barnabasrobotics.com.

### Creating New Blocks
1. While old chromeduino blocks still exist in blocks a new directory blocks/custom has been added.
you can create new files and add them to the index file or simply append them to the arduino.js file. 
1. For code generation you can also append that to arduino.js in blocks/custom but it is recommended to add your new generator in the generators/arduino directory and insert that to your index file.

Uploading the code to an arduino is currently a work in progress with eyes on [WebUSB](https://wicg.github.io/webusb/) or [WebSerial](https://github.com/WICG/serial)
With special thanks to @noopkat https://github.com/noopkat/avrgirl-arduino we can now flash to our Barnabas Noggin

### Authors and Contributors
Fred Lin @gasolin is the creator of BlocklyDuino.

Suz Hinton @noopkat for avrgirl.

BlocklyDuino is a **web-based visual programming editor for [Arduino](http://www.arduino.cc/)**.

BlocklyDuino is based on [Blockly](https://developers.google.com/blockly/), the web-based, graphical programming editor. Provide static type language blocks and code generators for Arduino programming.

Thanks Neil Fraser, Q.Neutron from [Blockly](https://developers.google.com/blockly/)

The project is also inspired by [ardublock](https://github.com/taweili/ardublock) and [modkit](http://www.modk.it/)

[makewitharduino](https://github.com/makewitharduino/Online-BlocklyDuinoEditor) is work by @okhiroyuki

There has been some interesting [chatter on Chromeduino](https://github.com/spaceneedle/Chromeduino/issues/12) perhaps some of these projects find a way to merge together.

### License

Copyright (C) 2020

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0

# Blockly [![Build Status]( https://travis-ci.org/google/blockly.svg?branch=master)](https://travis-ci.org/google/blockly)

Google's Blockly is a web-based, visual programming editor.  Users can drag
blocks together to build programs.  All code is free and open source.

**The project page is https://developers.google.com/blockly/**

![](https://developers.google.com/blockly/images/sample.png)

Blockly has an active [developer forum](https://groups.google.com/forum/#!forum/blockly). Please drop by and say hello. Show us your prototypes early; collectively we have a lot of experience and can offer hints which will save you time.

Help us focus our development efforts by telling us [what you are doing with
Blockly](https://developers.google.com/blockly/registration). The questionnaire only takes
a few minutes and will help us better support the Blockly community.

Want to contribute? Great! First, read [our guidelines for contributors](https://developers.google.com/blockly/guides/modify/contributing).


