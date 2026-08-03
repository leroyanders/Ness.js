import { cached } from '@nessframework/cache';

const loadFramework = cached(
  async () => ({
    name: 'Ness.js',
    version: 6,
    renderedAt: new Date().toISOString(),
  }),
  { key: 'welcome', life: 'minutes', tags: ['welcome'] },
);

export async function loader() {
  return loadFramework();
}
