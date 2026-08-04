import type { PluginOption } from 'vite';

export interface NessErrorOverlayOptions {
  /** Called for every unhandled server error before the overlay renders. */
  onError?: (error: Error, request: unknown) => void;
}

export interface NessViteOptions {
  root?: string;
  configFile?: string;
  rsc?: boolean;
  plugins?: PluginOption[];
  /**
   * Development error overlay. Enabled by default; pass `false` to fall back to
   * Vite's plain "Internal Server Error" response.
   */
  overlay?: boolean | NessErrorOverlayOptions;
}

export function ness(options?: NessViteOptions): PluginOption[];
export function nessVitePlugin(options?: NessViteOptions): PluginOption;
export function nessErrorOverlay(
  options?: NessErrorOverlayOptions,
): PluginOption;
export default ness;
