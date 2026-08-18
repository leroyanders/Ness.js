'use server';

export interface ClickResult {
  hits: number;
  receivedAt: string;
}

let hits = 0;

export async function recordClick(amount: number): Promise<ClickResult> {
  hits += Number(amount) || 0;
  return { hits, receivedAt: new Date().toISOString() };
}
