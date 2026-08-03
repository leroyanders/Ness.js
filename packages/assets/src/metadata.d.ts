export interface NessMetadata {
  title?: string | { default?: string; template?: string; absolute?: string };
  description?: string;
  applicationName?: string;
  generator?: string;
  keywords?: string | string[];
  themeColor?: string;
  colorScheme?: string;
  authors?: Array<string | { name: string }>;
  robots?: string | Record<string, boolean>;
  alternates?: { canonical?: string; languages?: Record<string, string> };
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  [key: string]: unknown;
}
export type MetaDescriptor = Record<string, string>;
export function mergeMetadata(
  parent?: NessMetadata,
  child?: NessMetadata,
): NessMetadata;
export function metadataToDescriptors(
  metadata?: NessMetadata,
): MetaDescriptor[];
export function defineMetadata(metadata: NessMetadata): MetaDescriptor[];
export function createManifest(manifest: Record<string, unknown>): Response;
export function createRobots(options?: Record<string, unknown>): Response;
export function createSitemap(
  entries: Array<string | Record<string, unknown>>,
): Response;
