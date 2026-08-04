export interface StandaloneOptions {
  /** Application root. Defaults to the working directory. */
  root?: string;
  /** Build output directory. Defaults to `build`. */
  buildDirectory?: string;
  /** Where to write the bundle. Defaults to `<buildDirectory>/standalone`. */
  outputDirectory?: string;
  /** Static files directory. Defaults to `public`. */
  publicDirectory?: string;
  /** Include devDependencies. Off by default — this is where the size is. */
  includeDevDependencies?: boolean;
  /** Packages to trace even though nothing declares them (runtime requires). */
  extraPackages?: string[];
  logger?: Pick<Console, 'log' | 'warn'> | null;
}

export interface StandaloneReport {
  output: string;
  packages: number;
  /** Declared dependencies that were not present on disk and were skipped. */
  missing: string[];
  bytes: number;
}

export function createStandaloneOutput(
  options?: StandaloneOptions,
): Promise<StandaloneReport>;

export default createStandaloneOutput;
