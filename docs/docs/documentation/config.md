# ness.config.js

We're trying to save you the hassle of configuring your applications, so we've developed config file rules where you can change whatever you need.

## Port configuration

```javascript title='ness.config.js' showLineNumbers
module.exports = {
    port: 3000,
}
```

## Plugins configuration

Read more about plugins [here](/docs/plugins/your-own-plugin).

```bash
npm install --save ness-xxx
```

```javascript title='ness.config.js' showLineNumbers
module.exports = {
    plugins: ['xxx'],
}
```

## Available options

+ enableSourceMaps - true/false enables source maps for static files.
+ verbose - true/false enables verbose output.
+ debug - debug options

Options:

+ options: false - print webpackOptions that will be used in webpack config
+ config: false - print webpack config
+ nodeExternals: false - print node externals debug info

```javascript title='ness.config.js' showLineNumbers
module.exports = {
    options: {
        enableSourceMaps: true
    }
}
```