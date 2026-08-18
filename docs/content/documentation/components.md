# Components

`@nessframework/components` covers the seams between React and the framework: page metadata, streaming loader data, pending UI, forms bound to actions, and state that belongs in the URL.

It is not a UI kit. The package ships no CSS and has no opinion about how your application looks — pair it with Tailwind, CSS Modules, or a component library, which is what it is designed to sit underneath.

```bash
ness add components
```

|                        |                                                                  |
| ---------------------- | ---------------------------------------------------------------- |
| `<Meta>`               | Groups a page's metadata                                         |
| `<Title>`              | The document title, mirrored to `og:title`                       |
| `<Description>`        | The description, mirrored to `og:description`                    |
| `<Canonical>`          | `<link rel="canonical">`                                         |
| `<Robots>`             | Crawler instructions                                             |
| `<SocialImage>`        | The link preview image and its card type                         |
| `<ClientOnly>`         | Renders only after hydration, for genuinely browser-only UI      |
| `<Streamed>`           | Renders a promise a loader returned without awaiting             |
| `<Pending>`            | Renders while the router is busy, with a delay to avoid flicker  |
| `<NavigationProgress>` | A progress container driven by navigation state                  |
| `<Form>`               | A form that hands `pending`, `data`, and `error` to its children |
| `<SearchField>`        | A debounced input bound to a search parameter                    |
| `<Pagination>`         | Page numbers and hrefs derived from the URL                      |

The hooks are exported too — `useHydrated`, `useActivity`, `useDelayed`, `useSearchParam`, and `useSubmitOnChange` — for markup none of the components fit.

## Metadata

React hoists `<title>`, `<meta>` and `<link>` into `<head>` from anywhere in the tree, so a page declares its own metadata in its own markup — no `meta` export, and nothing for a parent component to render on its behalf.

```tsx title="app/routes/pricing/page.tsx"
import { Canonical, Description, Meta, Title } from '@nessframework/components';

export default function Pricing() {
  return (
    <main>
      <Meta>
        <Title>Pricing · Acme</Title>
        <Description>What it costs, per seat and per month.</Description>
        <Canonical href="https://acme.com/pricing" />
      </Meta>
      <h1>Pricing</h1>
    </main>
  );
}
```

`<Title>` and `<Description>` each also emit their Open Graph equivalent, because a page that has bothered to name itself wants that name when it is shared.

Render `<Title>` once per page and never in the root or a shared layout. React does not deduplicate `<title>`: both reach the document and the browser takes the first, so a title in a layout silently wins over every page's own.

`<Title>` also flattens its children before rendering. React renders `<title>` empty when given more than one child, and `<Title>Pricing · {siteName}</Title>` is two — so interpolating into a title would otherwise erase it.

`<Meta>` renders nothing itself. It exists so metadata sits in one readable block instead of scattering through the markup; anything it does not model goes inside it as ordinary elements.

Pages arriving from Next can keep their object form instead: `export const metadata = {…}` and `export async function generateMetadata({params, loaderData})` are supported as route exports, title templates included, along with the file conventions (`icon.png`, `opengraph-image.tsx`, …). See [Next.js parity](./next-parity.md#route-metadata).

## Streaming

A loader that returns a promise without awaiting lets the document stream: the shell reaches the browser immediately and the slow part fills in when it settles.

```ts title="app/routes/products/[id]/page.server.ts"
export async function loader({ params }) {
  return {
    product: await getProduct(params.id), // blocks the shell
    reviews: getReviews(params.id), // streams in later
  };
}
```

```tsx title="app/routes/products/[id]/page.tsx"
import { Streamed } from '@nessframework/components';

export default function Product() {
  const { product, reviews } = useLoaderData();
  return (
    <article>
      <h1>{product.name}</h1>
      <Streamed
        value={reviews}
        fallback={<ReviewsSkeleton />}
        error={() => <p>Reviews are unavailable.</p>}
      >
        {list => <Reviews items={list} />}
      </Streamed>
    </article>
  );
}
```

Doing this by hand means wiring `<Suspense>`, `<Await>`, and an error element together; getting one of the three wrong turns a slow query into a blank page or an unhandled rejection. Passing `error` also keeps the failure local — one slow panel failing renders that panel's error rather than replacing the page through the route boundary.

## Forms

```tsx
import { Form } from '@nessframework/components';

<Form method="post" resetOnSuccess>
  {({ pending, error }) => (
    <>
      <input name="body" aria-invalid={Boolean(error)} />
      {error ? <p role="alert">{String(error)}</p> : null}
      <button disabled={pending}>{pending ? 'Posting…' : 'Post'}</button>
    </>
  )}
</Form>;
```

The state a form needs is otherwise spread across several hooks that each have to be called in the right place. This gathers them and passes them down.

It remains a real form: submitting works before hydration, and `children` may be ordinary elements instead of a function.

`resetOnSuccess` clears the fields on the transition out of pending, and only when the action did not report an error. Resetting on every render wipes what someone is typing.

## Search and pagination

The URL is the state. A filter, a query, or a page number belongs there so the view is linkable, survives the back button, and is re-fetched by the loader that already reads `request.url`.

```tsx
import { Pagination, SearchField } from '@nessframework/components';

<SearchField name="q" placeholder="Search products" />

<Pagination total={count} pageSize={20}>
  {({ pages, page, hrefFor, previousHref, nextHref }) => (
    <nav aria-label="Pagination">
      {previousHref ? <Link to={previousHref}>Previous</Link> : null}
      {pages.map(number => (
        <Link
          key={number}
          to={hrefFor(number)}
          aria-current={number === page ? 'page' : undefined}
        >
          {number}
        </Link>
      ))}
      {nextHref ? <Link to={nextHref}>Next</Link> : null}
    </nav>
  )}
</Pagination>
```

`SearchField` debounces, so a keystroke is not a navigation and a loader call. Both read from the URL, so a shared link restores the exact view.

`Pagination` omits the parameter for the first page, keeping `/products` and `/products?page=1` one URL rather than two a crawler treats as duplicates. It clamps an out-of-range or malformed `page` rather than rendering an empty result.

## Pending UI

```tsx
<Pending when="navigation" delay={200}>
  <Spinner />
</Pending>
```

`when` narrows to `'navigation'`, `'submission'`, or `'any'`. `delay` suppresses the render until the work has been in flight that long, so a fast response produces no spinner at all — one that appears for 80 ms and vanishes reads as a glitch.

## Browser-only UI

```tsx
<ClientOnly fallback={<ChartSkeleton />}>{() => <Chart />}</ClientOnly>
```

For code that measures the DOM, reads `window`, or renders from the local time zone. Reading `typeof window` during render instead would give the server and the first client render different answers, and React would discard the server HTML for that subtree.

Give the fallback the same footprint as the real content, or hydration will shift the layout.

## Styling

Every component renders plain semantic markup and forwards `className`, `style`, and its remaining props. Where a component has state worth styling, it exposes a data attribute rather than a class name:

```css
[data-ness-progress] {
  /* the router is busy */
}
[data-ness-progress='submitting'] {
  /* specifically a submission */
}
form[data-ness-pending] {
  /* this form is in flight */
}
```
