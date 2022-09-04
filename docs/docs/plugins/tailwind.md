---
sidebar_position: 3
---

# ness-tailwind

This plugin provides the ability to use Tailwind CSS.

## What is the Tailwind CSS?

Tailwind CSS makes it quicker to write and maintain the code of your application. By using this utility-first framework, you don't have to write custom CSS to style your application. Instead, you can use utility classes to control the padding, margin, color, font, shadow, and more of your application.

## Installation

First of all, you need to install this plugin with the following command:

```bash
npm install --save ness-tailwind@latest
```

## Configuration

As all plugins, this plugin configuring in **ness.config.js**. You can use the following or simply configure by passing from tailwind official documentation website.

```jsx
module.exports = {
    "plugins": [
        {
            name: 'tailwind', // set name without prefix (ness-*)
            config: {
                darkMode: ['class'],
                theme: {
                    screens: {
                        xs: { max: '575px' },
                        sm: { min: '576px', max: '897px' },
                        md: { min: '898px', max: '1199px' },
                        lg: { min: '1200px' },
                        xl: { min: '1159px' },
                        xxl: { min: '1359px' }
                    }
                },
                content: ["./src/**/*.{html,js}"],
                plugins: [],
            }
        }
    ]
}
```

For better performance see the [Tailwind documentation](https://tailwindcss.com/docs/configuration).
