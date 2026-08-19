/**
 * The prefetch table the router's Vite plugin generates. Absent in a build
 * without that plugin, which is why `routeTable()` swallows the import error.
 */
declare module 'virtual:ness/route-prefetch' {
  export const routes: Array<{
    path: string;
    id: string;
    serverLoader?: boolean;
    wrapped?: boolean;
    load: () => Promise<{
      clientLoader?: (args: {
        request: Request;
        params: Record<string, string | undefined>;
      }) => unknown;
    }>;
  }>;
  /** Which data extension this build navigates with: 'rsc' or 'data'. */
  export const mode: string | undefined;
}

/**
 * The intercepting-route table the router's Vite plugin generates. Absent in
 * a build without that plugin, which is why `interceptorTable()` swallows the
 * import error.
 */
declare module 'virtual:ness/interceptors' {
  export const interceptors: Array<{
    from: string;
    pattern: string;
    load: () => Promise<{
      default: import('react').ComponentType<{
        params: Record<string, string | undefined>;
      }>;
    }>;
  }>;
}

/** Vite's `import.meta.env`, only the flags this package reads. */
interface ImportMetaEnv {
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly MODE?: string;
  readonly NESS_PUBLIC_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}

/** `navigator.connection` is not part of the DOM lib. */
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}
