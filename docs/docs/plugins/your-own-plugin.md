# How to create your own plugin?

We want to achieve universality, so we give you the opportunity to create public plugins or create them directly in the project folder.

## Instruction (public plugin)

:::caution Name of the plugin
Please not that the plugin must have prefix **ness-**, it is required, otherwise the plugin will not be available in the project.
:::

Let's create a plugin with the following configuration.

```js title='your_plugin/index.js' showLineNumbers
/*
    *    function install used to install the plugin. 
    *    contains two arguments(webpack configuration and plugin configuration)
    *
    *    config - webpack configuration
    *    options = {
    *        target: 'web' || 'node',
    *        env: 'prod'   || 'dev',
    *    }
    *   Also options contains options from ness.config.js
*/

'use strict';

module.exports = {
    install(config, options) {
        ...
        return config;
    }
};
```

After modification webpack configuration, the plugin **must return changed configuration**.
After all done, please test your plugin localy and then push to NPM registry publicaly.

### Configuration

```js title='./ness.config.js' showLineNumbers
module.exports = {
    "plugins": [
        ...
        {
            name: 'your-plugin-name', // plugin name name without prefix
            config: {...}
        }
    ]
}
```

## Instruction (local plugin)

This way the same, but you must use parameter `entrypoint` in ness.config.js

```js title='your_plugin/index.js' showLineNumbers
/*
    *    function install used to install the plugin. 
    *    contains two arguments(webpack configuration and plugin configuration)
    *
    *    config - webpack configuration
    *    options = {
    *        target: 'web' || 'node',
    *        env: 'prod'   || 'dev',
    *    }
    *   Also options contains options from ness.config.js
*/

'use strict';

module.exports = {
    install(config, options) {
        ...
        return config;
    }
};
```

```js title='Configuration in ./ness.config.js' showLineNumbers

const path = require('path');

module.exports = {
    "plugins": [
        ...
        {
            entrypoint: path.join(__dirname, 'src', 'plugins/your-plugin.js'),
            config: {...}
        }
    ]
}
```
