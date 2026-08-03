import type { PluginOption } from 'vite';

export interface NessViteOptions {
  root?: string;
  configFile?: string;
  rsc?: boolean;
  plugins?: PluginOption[];
}

export function ness(options?: NessViteOptions): PluginOption[];
export function nessVitePlugin(options?: NessViteOptions): PluginOption;
export default ness;
