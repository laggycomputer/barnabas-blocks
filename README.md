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
3. New block definitions should be placed in `blocks/custom.js`.
4. New generators should be added to `generators/custom.js`. These are named to match block names. For example, the serial print block is defined with the name `print_ln`, and its generator has the same name.
5. Finally, an XML tree in `index.html` defines how blocks appear in drawers. Add your block to an existing category or make a new one. Make sure you add input blocks if your block has inputs otherwise the entire drawer will break.

### Authors and Contributors
Fred Lin @gasolin is the creator of BlocklyDuino.

Suz Hinton @noopkat for avrgirl.

Thanks Neil Fraser, Q.Neutron from [Blockly](https://developers.google.com/blockly/)

The project is also inspired by [ardublock](https://github.com/taweili/ardublock) and [modkit](http://www.modk.it/)

[makewitharduino](https://github.com/makewitharduino/Online-BlocklyDuinoEditor) is work by @okhiroyuki

There has been some interesting [chatter on Chromeduino](https://github.com/spaceneedle/Chromeduino/issues/12) perhaps some of these projects find a way to merge together.
