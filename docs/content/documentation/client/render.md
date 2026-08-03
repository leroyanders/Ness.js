# Client runtime

The framework generates the hydration entry automatically. Application code normally imports navigation primitives from `@ness/core` or `react-router`:

```tsx
import {
  Link,
  useNavigationProgress,
  usePathname,
  useRouter,
} from '@ness/core';

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

`useRouter` exposes `push`, `replace`, `back`, `forward`, `refresh`, and `prefetch`. Links can prefetch route modules and data, and navigation automatically preserves race-condition safety.

Run `ness reveal entry.client` only when custom hydration behavior is required.
