/**
 * `envinfo` ships no types and has no @types package. Only the one call
 * `ness info` makes is described here.
 */
declare module 'envinfo' {
  export interface EnvinfoOptions {
    duplicates?: boolean;
    showNotFound?: boolean;
    json?: boolean;
    markdown?: boolean;
    console?: boolean;
  }
  export function run(
    spec: Record<string, string[]>,
    options?: EnvinfoOptions,
  ): Promise<string>;
  const envinfo: { run: typeof run };
  export default envinfo;
}
