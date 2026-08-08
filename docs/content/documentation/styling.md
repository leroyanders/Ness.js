# Styling

Vite processes imported CSS and extracts production assets automatically.

```tsx
// app/root.tsx — global styles
import './styles/app.css';
```

CSS Modules use the `.module.css` convention:

```tsx
import styles from './card.module.css';

export function Card() {
  return <article className={styles.card}>Content</article>;
}
```

PostCSS, Sass, Tailwind, and other Vite-compatible tools can be added through the `vite` section of `ness.config.mjs`. Route CSS is code-split with its route module where supported by the selected plugin.

Tailwind has a first-party plugin. `@nessframework/tailwind` registers `@tailwindcss/postcss` in Vite's PostCSS pipeline and adds cssnano to a production build; it goes in the plugin list `ness()` takes:

```js title="ness.config.mjs"
import { defineNessConfig } from '@nessframework/router';
import { ness } from '@nessframework/router/vite';
import { tailwind } from '@nessframework/tailwind';

export default defineNessConfig({
  vite: { plugins: [ness({ plugins: [tailwind()] })] },
});
```

See [@nessframework/tailwind](../plugins/tailwind.md).
