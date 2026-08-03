# @ness/tailwind

## Installation

```bash
npm install @ness/tailwind
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
import { ness } from '@ness/router/vite';
import { tailwind } from '@ness/tailwind';

export default {
  plugins: [ness({ plugins: [tailwind()] })],
};
```

The base stylesheet is available as an explicit package export:

```css
@import '@ness/tailwind/styles/base.css';
```
