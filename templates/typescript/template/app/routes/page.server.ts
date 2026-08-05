import { cached } from '@nessframework/cache';

const loadFramework = cached(
  async () => ({
    name: 'Ness.js',
    renderedAt: new Date().toISOString(),
  }),
  { key: 'welcome', life: 'minutes', tags: ['welcome'] },
);

export async function loader() {
  return loadFramework();
}
