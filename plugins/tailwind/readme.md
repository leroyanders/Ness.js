# @nessframework/tailwind

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

For Ness 6, enable it in Vite:

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
