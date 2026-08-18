import { cached } from '@nessframework/cache';

/**
 * Cached for a minute, which the page uses to show the cache working: reload
 * and `renderedAt` holds still while `servedAt` keeps moving. Remove the
 * wrapper and both change on every request.
 */
const readBuildInfo = cached(
  async () => ({
    renderedAt: new Date().toISOString(),
    node: process.version,
  }),
  { key: 'welcome', life: 'minutes', tags: ['welcome'] },
);

export async function loader({ request }: { request: Request }) {
  const started = performance.now();
  const build = await readBuildInfo();

  return {
    ...build,
    servedAt: new Date().toISOString(),
    pathname: new URL(request.url).pathname,
    durationMs: Number((performance.now() - started).toFixed(2)),
  };
}
