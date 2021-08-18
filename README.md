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
1. Creating a new block has three parts - creating a block definition, creating a generator, and adding the block to a drawer. 
2. Old blocks from Chromeduino are still used as a base layer of definitions. These should not be touched without good reason.
3. New block definitions should be placed in `blocks/custom_blocks.js`.
4. New generators should be added to `generators/custom_generators.js`. These are named to match block names. For example, the serial print block is defined with the name `print_ln`, and its generator has the same name.
5. Finally, two XML trees in `index.html` defines how blocks appear in the simple and advanced "lessons" (accessible via the dropdown at the top of the page). If your block is simple enough to add to the simple lesson (this is quite rare), then it should be added to the simple lesson tree (labeled `bot_toolbox`). All new blocks should be added to the advanced lesson (labled `racer_toolbox`), which is designed to provide full access to available blocks.

### Authors and Contributors
Fred Lin @gasolin is the creator of BlocklyDuino.

Suz Hinton @noopkat for avrgirl.

Thanks Neil Fraser, Q.Neutron from [Blockly](https://developers.google.com/blockly/)

The project is also inspired by [ardublock](https://github.com/taweili/ardublock) and [modkit](http://www.modk.it/)

[makewitharduino](https://github.com/makewitharduino/Online-BlocklyDuinoEditor) is work by @okhiroyuki

There has been some interesting [chatter on Chromeduino](https://github.com/spaceneedle/Chromeduino/issues/12) perhaps some of these projects find a way to merge together.
