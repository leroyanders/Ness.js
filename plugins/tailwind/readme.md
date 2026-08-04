<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/tailwind</h1>

<p align="center">Tailwind CSS integration for Ness.js</p>

## Installation

```bash
npm install @nessframework/tailwind
```

## Configuration

```javascript
export default {
  plugins: ['tailwind'],
};
```

Ness Tailwind uses Tailwind CSS 4 with automatic source detection and CSS-first configuration.

Enable it in Vite:

```js
import { ness } from '@nessframework/router/vite';
import { tailwind } from '@nessframework/tailwind';

export default {
  plugins: [ness({ plugins: [tailwind()] })],
};
```

The base stylesheet is available as an explicit package export:

```css
@import '@nessframework/tailwind/styles/base.css';
```
