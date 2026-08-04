import type { Plugin } from 'vite';

export type EnvironmentRule =
  | true
  | 'required'
  | RegExp
  | ((value: string, name: string) => boolean | string)
  | {
      required?: boolean;
      pattern?: RegExp;
      choices?: string[];
      validate?: (value: string, name: string) => boolean | string;
    };

export interface EnvOptions {
  schema?: Record<string, EnvironmentRule>;
  values?: Record<string, string | undefined>;
}

export function validateEnvironment(
  schema: Record<string, EnvironmentRule>,
  values?: Record<string, string | undefined>,
): Readonly<Record<string, string>>;
export function env(options?: EnvOptions): Plugin;
export default env;
