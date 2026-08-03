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
