<p align="center">
  <img src="https://raw.githubusercontent.com/leroyanders/Ness.js/master/docs/static/img/logo.png" alt="" width="96" height="96" />
</p>

<h1 align="center">@nessframework/components</h1>

<p align="center">Unstyled React components bound to the Ness.js request lifecycle: streaming, pending state, optimistic forms, and URL-driven search and pagination.</p>

These are not a UI kit. There is no CSS in this package and nothing here has an
opinion about how your application looks — pair it with Tailwind, CSS Modules,
or a component library. What it covers is the part those libraries cannot: the
seams between React and the framework's loaders, actions, streaming, and URL.

```bash
ness add components
```

## Components

|                        |                                                                  |
| ---------------------- | ---------------------------------------------------------------- |
| `<ClientOnly>`         | Renders only after hydration, for genuinely browser-only UI      |
| `<Streamed>`           | Renders a promise a loader returned without awaiting             |
| `<Pending>`            | Renders while the router is busy, with a delay to avoid flicker  |
| `<NavigationProgress>` | A progress container driven by navigation state                  |
| `<Form>`               | A form that hands `pending`, `data`, and `error` to its children |
| `<SearchField>`        | A debounced input bound to a search parameter                    |
| `<Pagination>`         | Page numbers and hrefs derived from the URL                      |

Hooks: `useHydrated`, `useActivity`, `useDelayed`, `useSearchParam`,
`useSubmitOnChange`.

## Streaming a slow query

A loader that returns a promise without awaiting lets the document stream: the
shell is sent immediately and this subtree fills in when the promise settles.

```ts title="app/routes/products/[id]/page.server.ts"
export async function loader({ params }) {
  return {
    product: await getProduct(params.id), // blocks the shell
    reviews: getReviews(params.id), // streams in later
  };
}
```

```tsx
<Streamed
  value={reviews}
  fallback={<ReviewsSkeleton />}
  error={() => <p>Reviews are unavailable.</p>}
>
  {list => <Reviews items={list} />}
</Streamed>
```

Passing `error` keeps a rejection local: one slow panel failing renders that
panel's error instead of replacing the whole page through the route boundary.

## Forms

```tsx
<Form method="post" resetOnSuccess>
  {({ pending, error }) => (
    <>
      <input name="body" aria-invalid={Boolean(error)} />
      {error ? <p role="alert">{String(error)}</p> : null}
      <button disabled={pending}>{pending ? 'Posting…' : 'Post'}</button>
    </>
  )}
</Form>
```

It is still a real form: submitting works before hydration, and `children` may
be ordinary elements instead of a function.

`resetOnSuccess` clears the fields on the transition out of pending, and only
when the action did not report an error — resetting on every render wipes what
someone is typing.

## Search and pagination

The URL is the state. A filter, a query, or a page number belongs there so the
view is linkable, restorable with the back button, and re-fetched by the loader
that already reads `request.url`.

```tsx
<SearchField name="q" placeholder="Search products" />

<Pagination total={count} pageSize={20}>
  {({ pages, page, hrefFor, previousHref, nextHref }) => (
    <nav aria-label="Pagination">
      {previousHref ? <Link to={previousHref}>Previous</Link> : null}
      {pages.map(number => (
        <Link key={number} to={hrefFor(number)} aria-current={number === page ? 'page' : undefined}>
          {number}
        </Link>
      ))}
      {nextHref ? <Link to={nextHref}>Next</Link> : null}
    </nav>
  )}
</Pagination>
```

`SearchField` debounces, so a keystroke is not a loader call. The first page
omits the parameter, so `/products` and `/products?page=1` stay one URL rather
than two a crawler treats as duplicates.

## Pending UI

```tsx
<Pending when="navigation" delay={200}>
  <Spinner />
</Pending>
```

`delay` suppresses the render until the work has been in flight that long, so a
fast response produces no spinner at all. A spinner that appears for 80 ms and
vanishes reads as a glitch — pending UI is usually worse than none unless it
waits.

## Styling

Every component renders plain semantic markup and forwards `className`, `style`,
and the rest of its props. Where a component has state worth styling it exposes
a data attribute rather than a class:

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

## Requirements

React 19.2.7+ and React Router 8+, both peer dependencies. Node 20.19+.
