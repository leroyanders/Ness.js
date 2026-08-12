export interface VercelHandlerOptions {
  /** The server build: `import * as build from './build/server/index.js'`. */
  build: unknown;
  /** A runtime-only config module, applied on the first request. */
  config?: unknown;
  /** Directory containing `build/`. Defaults to `process.cwd()`. */
  root?: string;
  [option: string]: unknown;
}

export interface VercelOutputOptions {
  /** Application root. Defaults to the working directory. */
  root?: string;
  /** Build output directory. Defaults to `build`. */
  buildDirectory?: string;
  /** Where to write the Build Output API tree. Defaults to `.vercel/output`. */
  outputDirectory?: string;
  /** Runtime-only config file to bundle into the entry, relative to root. Auto-detected if omitted. */
  configPath?: string;
  /** `.vc-config.json` `runtime` value. Defaults to `nodejs22.x`. */
  runtime?: string;
  /** Packages to trace even though nothing declares them (runtime requires). */
  extraPackages?: string[];
  logger?: Pick<Console, 'log' | 'warn'> | null;
}

export interface VercelOutputReport {
  /** The `.vercel/output` directory. */
  output: string;
  /** The `.vercel/output/functions/index.func` directory. */
  function: string;
  packages: number;
  /** Declared dependencies that were not present on disk and were skipped. */
  missing: string[];
  /** Size in bytes of the function directory. */
  bytes: number;
}

export function createVercelHandler(
  options: VercelHandlerOptions,
): (request: unknown, response: unknown) => Promise<void>;

export default createVercelHandler;

export const VERCEL_ENTRY: string;

/** The generated Vercel Function entry. Pass `configPath` to bundle a runtime config. */
export function vercelEntry(options?: { configPath?: string }): string;

export function createVercelOutput(
  options?: VercelOutputOptions,
): Promise<VercelOutputReport>;
