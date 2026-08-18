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

interface NormalizedRule {
  required?: boolean;
  pattern?: RegExp;
  choices?: string[];
  validate?: (value: string, name: string) => boolean | string;
}

function normalizeRule(rule: EnvironmentRule | undefined): NormalizedRule {
  if (rule === true || rule === 'required') return { required: true };
  if (rule instanceof RegExp) return { pattern: rule };
  if (typeof rule === 'function') return { validate: rule };
  return rule || {};
}

function validateRule(
  name: string,
  value: string | undefined,
  inputRule: EnvironmentRule | undefined,
): string | null {
  const rule = normalizeRule(inputRule);
  const missing = value == null || value === '';
  if (rule.required && missing) return 'is required';
  if (missing) return null;

  if (rule.pattern) {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(value)) return 'has an invalid format';
  }
  if (rule.choices && !rule.choices.includes(value)) {
    return `must be one of: ${rule.choices.join(', ')}`;
  }
  if (rule.validate) {
    const result = rule.validate(value, name);
    if (result === false) return 'is invalid';
    if (typeof result === 'string') return result;
  }
  return null;
}

function validateEnvironment(
  schema: Record<string, EnvironmentRule> | undefined,
  values: Record<string, string | undefined> = process.env,
): Readonly<Record<string, string>> {
  const errors: string[] = [];
  const environment: Record<string, string> = {};
  for (const [name, rule] of Object.entries(schema || {})) {
    const value = values[name];
    const error = validateRule(name, value, rule);
    if (error) errors.push(`${name} ${error}`);
    if (value != null) environment[name] = value;
  }
  if (errors.length) {
    throw new Error(
      `Invalid Ness environment:\n${errors.map(error => `- ${error}`).join('\n')}`,
    );
  }
  return Object.freeze(environment);
}

function env(options: EnvOptions = {}): Plugin {
  return {
    name: 'ness:env',
    enforce: 'pre',
    configResolved(config) {
      validateEnvironment(options.schema, {
        ...process.env,
        ...(config.env || {}),
        ...(options.values || {}),
      });
    },
  };
}

export { env, validateEnvironment };
export default env;
