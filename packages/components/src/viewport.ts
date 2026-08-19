import { createElement, Fragment, use } from 'react';
import type { ReactNode } from 'react';

/**
 * Route-level viewport configuration, in the object shape `export const
 * viewport` and `generateViewport` return — Next's separate viewport export,
 * kept separate here for the same reason: theme color and scaling are device
 * presentation, not document description, and pages arrive with the two
 * already written apart.
 */
export interface Viewport {
  width?: string | number;
  height?: string | number;
  initialScale?: number;
  minimumScale?: number;
  maximumScale?: number;
  userScalable?: boolean;
  viewportFit?: 'auto' | 'contain' | 'cover';
  interactiveWidget?: 'resizes-visual' | 'resizes-content' | 'overlays-content';
  themeColor?: string | Array<{ media?: string; color: string }>;
  colorScheme?: string;
}

/** What `generateViewport` receives. */
export interface GenerateViewportArgs {
  params: Record<string, string | undefined>;
}

export type GenerateViewport = (
  args: GenerateViewportArgs,
) => Viewport | Promise<Viewport>;

/** `initialScale` → `initial-scale`, the spelling the meta tag wants. */
function dash(name: string): string {
  return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function viewportContent(viewport: Viewport): string | undefined {
  const parts: string[] = [];
  for (const name of [
    'width',
    'height',
    'initialScale',
    'minimumScale',
    'maximumScale',
    'viewportFit',
    'interactiveWidget',
  ] as const) {
    const value = viewport[name];
    if (value !== undefined) parts.push(`${dash(name)}=${String(value)}`);
  }
  if (viewport.userScalable !== undefined)
    parts.push(`user-scalable=${viewport.userScalable ? 'yes' : 'no'}`);
  return parts.length ? parts.join(', ') : undefined;
}

/**
 * One viewport object, rendered as the tags it means. React hoists `<meta>`
 * into `<head>` from anywhere in the tree; when a layout and its page both
 * declare a viewport, the page renders later in document order and the
 * browser applies the last `name="viewport"` it sees — the deepest segment
 * wins, which is also Next's rule.
 */
function ViewportTags({ viewport }: { viewport: Viewport }): ReactNode {
  const content = viewportContent(viewport);
  const themeColors =
    viewport.themeColor === undefined
      ? []
      : typeof viewport.themeColor === 'string'
        ? [{ color: viewport.themeColor }]
        : viewport.themeColor;
  return createElement(
    Fragment,
    null,
    content === undefined
      ? null
      : createElement('meta', {
          key: `viewport:${content}`,
          name: 'viewport',
          content,
        }),
    ...themeColors.map(entry =>
      createElement('meta', {
        key: `theme-color:${entry.media ?? ''}:${entry.color}`,
        name: 'theme-color',
        content: entry.color,
        ...(entry.media ? { media: entry.media } : {}),
      }),
    ),
    viewport.colorScheme === undefined
      ? null
      : createElement('meta', {
          key: `color-scheme:${viewport.colorScheme}`,
          name: 'color-scheme',
          content: viewport.colorScheme,
        }),
  );
}

/**
 * The same promise-identity rule `RouteMetadata` lives by: `use()` retries a
 * suspended component from scratch, so `generateViewport` must hand back the
 * same promise on every attempt. Cached per function, per params.
 */
const generated = new WeakMap<
  GenerateViewport,
  Map<string, Viewport | Promise<Viewport>>
>();

function produceViewport(
  viewport: GenerateViewport,
  args: GenerateViewportArgs,
): Viewport | Promise<Viewport> {
  const key = JSON.stringify(args.params ?? {});
  let byParams = generated.get(viewport);
  if (!byParams) {
    byParams = new Map();
    generated.set(viewport, byParams);
  }
  const cached = byParams.get(key);
  if (cached) return cached;
  const produced = viewport(args);
  byParams.set(key, produced);
  return produced;
}

/**
 * Renders the tags for a route's `viewport` or `generateViewport` export.
 * Static objects render directly; a function is called with the route's
 * params, and a returned promise suspends via `use()`.
 */
function RouteViewport({
  viewport,
  args,
}: {
  viewport: Viewport | GenerateViewport | undefined;
  args?: GenerateViewportArgs;
}): ReactNode {
  if (!viewport) return null;
  let resolved: Viewport;
  if (typeof viewport === 'function') {
    const produced = produceViewport(viewport, args ?? { params: {} });
    resolved =
      produced && typeof (produced as Promise<Viewport>).then === 'function'
        ? use(produced as Promise<Viewport>)
        : (produced as Viewport);
  } else {
    resolved = viewport;
  }
  return createElement(ViewportTags, { viewport: resolved });
}

export { RouteViewport, ViewportTags };
