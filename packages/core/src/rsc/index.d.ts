export const RSC_FEATURE: 'experimental-rsc';
export function experimentalRsc<T extends Record<string, unknown>>(
  options?: T,
): T & { rsc: true; feature: string };
export function assertSerializable<T>(value: T, path?: string): T;
export function serverOnly<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result;
