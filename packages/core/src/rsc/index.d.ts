export const RSC_FEATURE: 'experimental-rsc';

export interface RscSupport {
  /** Verified by the end-to-end suite on every commit. */
  readonly supported: readonly string[];
  /** Known gaps, not untested claims. */
  readonly unsupported: readonly string[];
  /** Pre-stable upstream APIs the pipeline is built on. */
  readonly upstream: Readonly<Record<string, string>>;
}

export const RSC_SUPPORT: RscSupport;
export function rscSupport(): RscSupport;

export function experimentalRsc<T extends Record<string, unknown>>(
  options?: T,
): T & { rsc: true; feature: string };
export function assertSerializable<T>(value: T, path?: string): T;
export function serverOnly<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result;
