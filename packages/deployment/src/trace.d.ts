export interface PackageManifest {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  [field: string]: unknown;
}

export interface TraceOptions {
  manifest?: PackageManifest;
  /** Packages to include even though nothing declares them. */
  extra?: string[];
  onMissing?: (name: string) => void;
}

export interface TraceResult {
  /** Package name to resolved directory. */
  packages: Map<string, string>;
  missing: string[];
}

export function readManifest(directory: string): PackageManifest | undefined;
export function resolvePackageDirectory(
  name: string,
  from: string,
  root: string,
): string | undefined;
export function traceDependencies(
  root: string,
  options?: TraceOptions,
): TraceResult;
