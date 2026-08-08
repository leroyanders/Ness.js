---
sidebar_position: 3
---

# @nessframework/tailwind

This plugin provides the ability to use Tailwind CSS.

## What is the Tailwind CSS?

Tailwind CSS makes it quicker to write and maintain the code of your application. By using this utility-first framework, you don't have to write custom CSS to style your application. Instead, you can use utility classes to control the padding, margin, color, font, shadow, and more of your application.

## Installation

First of all, you need to install this plugin with the following command:

```bash
ness add tailwind --dev
```

## Configuration

Tailwind CSS 4 discovers source files automatically and uses CSS-first configuration.

```js showLineNumbers
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import { tailwind } from '@nessframework/tailwind';

export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [tailwind()] })] },
});
```

Import the optional base stylesheet with `@import '@nessframework/tailwind/styles/base.css';`.

The plugin runs cssnano after Tailwind on builds and not in development. Pass `minify: true` to minify in development as well, or `minify: false` to leave the built CSS unminified.

For custom themes and sources, see the [Tailwind CSS documentation](https://tailwindcss.com/docs/theme).
