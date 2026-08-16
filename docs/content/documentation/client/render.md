# Client runtime

The framework generates the hydration entry automatically. Application code normally imports navigation primitives from `@nessframework/core` or `react-router`:

```tsx
import {
  Link,
  useNavigationProgress,
  usePathname,
  useRouter,
} from '@nessframework/core';

export function Navigation() {
  const pathname = usePathname();
  const navigation = useNavigationProgress();
  const router = useRouter();

  return (
    <nav aria-busy={navigation.pending}>
      <Link to="/">Home</Link>
      <button onClick={() => router.refresh()}>Refresh {pathname}</button>
    </nav>
  );
}
```

`useRouter` exposes `push`, `replace`, `back`, `forward`, `refresh`, and `prefetch`. `push` and `replace` accept `{ scroll: false }` as well as react-router's `preventScrollReset`, and so does `<Link>`.

`<Link prefetch>` warms both the route module and its data: `auto` (the default) means once the link is on screen in a build and on hover in development, and nothing at all on a metered or slow connection; `intent` is hover or focus only; `viewport` and `render` are the eager ends; `none` opts out.

Run `ness reveal entry.client` only when custom hydration behavior is required.
