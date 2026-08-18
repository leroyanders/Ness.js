/**
 * The prefetch table the router's Vite plugin generates. Absent in a build
 * without that plugin, which is why `routeTable()` swallows the import error.
 */
declare module 'virtual:ness/route-prefetch' {
  export const routes: Array<{
    path: string;
    id: string;
    load: () => Promise<{
      clientLoader?: (args: {
        request: Request;
        params: Record<string, string | undefined>;
      }) => unknown;
    }>;
  }>;
}

/** Vite's `import.meta.env`, only the flag this package reads. */
interface ImportMetaEnv {
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}

/** `navigator.connection` is not part of the DOM lib. */
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}
