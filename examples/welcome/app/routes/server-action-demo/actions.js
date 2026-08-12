'use server';

let hits = 0;

export async function recordClick(amount) {
  hits += Number(amount) || 0;
  return { hits, receivedAt: new Date().toISOString() };
}
