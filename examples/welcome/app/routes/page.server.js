import { cached } from '@ness/cache';

const loadFramework = cached(
  async () => ({
    name: 'Ness.js',
    version: 6,
    generatedAt: new Date().toISOString(),
  }),
  { key: 'welcome-example', life: 'minutes', tags: ['framework', 'welcome'] },
);

export async function loader() {
  return loadFramework();
}

export async function action({ request }) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  return { subscribed: email };
}

export function headers() {
  return { 'x-ness-example': 'welcome' };
}
