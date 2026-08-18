import path from 'node:path';
import fs from 'fs-extra';
import { paint } from '../lib/colors.js';

const GENERATOR_TYPES = [
  'page',
  'layout',
  'route',
  'controller',
  'resource',
  'loading',
  'error',
  'not-found',
  'forbidden',
  'unauthorized',
  'component',
  'action',
  'middleware',
  'service',
  'module',
  'hook',
  'context',
  'model',
  'guard',
  'class',
  'interface',
  'enum',
  'test',
] as const;

export type GeneratorType = (typeof GENERATOR_TYPES)[number];

export interface GenerateOptions {
  cwd?: string;
  force?: boolean;
  dryRun?: boolean;
}

const GENERATOR_ALIASES: Record<string, GeneratorType> = {
  a: 'action',
  c: 'component',
  cl: 'class',
  co: 'controller',
  ctx: 'context',
  e: 'enum',
  gu: 'guard',
  h: 'hook',
  i: 'interface',
  l: 'layout',
  m: 'model',
  mi: 'middleware',
  mo: 'module',
  p: 'page',
  provider: 'service',
  r: 'route',
  res: 'resource',
  s: 'service',
  spec: 'test',
};

export function resolveGeneratorType(rawType: string): GeneratorType {
  const type = String(rawType || '').toLowerCase();
  const resolved = GENERATOR_ALIASES[type] || type;
  if (!(GENERATOR_TYPES as readonly string[]).includes(resolved)) {
    throw new Error(
      `Unknown generator ${rawType}. Use one of: ${GENERATOR_TYPES.join(', ')}.`,
    );
  }
  return resolved as GeneratorType;
}

function projectUsesTypeScript(cwd: string = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, 'tsconfig.json'));
}

function safeGeneratorName(name: string): string {
  const normalized = String(name)
    .replaceAll('\\', '/')
    .replace(/^\/+|\/+$/g, '');
  if (
    !normalized ||
    normalized.split('/').some(segment => segment === '..' || segment === '.')
  ) {
    throw new Error(
      'Generator names must be relative paths without . or .. segments.',
    );
  }
  return normalized;
}

function componentName(name: string): string {
  const result = name
    .split(/[\\/._-]+/)
    .filter(Boolean)
    .map(part => `${part[0]!.toUpperCase()}${part.slice(1)}`)
    .join('')
    .replace(/[^a-zA-Z0-9_$]/g, '');
  return /^[a-zA-Z_$]/.test(result) ? result : `Ness${result}`;
}

function generatorSource(
  type: GeneratorType,
  name: string,
  typescript: boolean,
): string {
  const symbol = componentName(path.basename(name));
  switch (type) {
    case 'page':
      return `export const meta = () => [{title: '${symbol} | Ness.js'}];\n\nexport default function ${symbol}Page() {\n  return <main><h1>${symbol}</h1></main>;\n}\n`;
    case 'layout':
      return `import {RouteOutlet} from '@nessframework/core/client';\n\n// Shows the fallback below during a client-side transition between this\n// layout's child routes, and skips a re-fetch when navigating back to a\n// route already visited. Replace the fallback with whatever fits this\n// layout — see https://nessjs.com/docs/documentation/routing#route-outlet.\nexport default function ${symbol}Layout() {\n  return <RouteOutlet fallback={<p role="status">Loading…</p>} />;\n}\n`;
    case 'route':
      return `export async function GET() {\n  return Response.json({ok: true});\n}\n`;
    case 'controller':
      return `import {Body, Controller, Get, Post} from '@nestjs/common';\n\n@Controller(${JSON.stringify(name)})\nexport class ${symbol}Controller {\n  @Get()\n  findAll() {\n    return [];\n  }\n\n  @Post()\n  create(@Body() input: Record<string, unknown>) {\n    return input;\n  }\n}\n`;
    case 'resource':
      return `import {Body, Controller, Delete, Get, Param, Patch, Post} from '@nestjs/common';\n\n@Controller(${JSON.stringify(name)})\nexport class ${symbol}Controller {\n  @Get()\n  findAll() {\n    return [];\n  }\n\n  @Get(':id')\n  findOne(@Param('id') id: string) {\n    return {id};\n  }\n\n  @Post()\n  create(@Body() input: Record<string, unknown>) {\n    return input;\n  }\n\n  @Patch(':id')\n  update(@Param('id') id: string, @Body() input: Record<string, unknown>) {\n    return {id, ...input};\n  }\n\n  @Delete(':id')\n  remove(@Param('id') id: string) {\n    return {id};\n  }\n}\n`;
    case 'loading':
      return `export default function ${symbol}Loading() {\n  return <p role="status">Loading…</p>;\n}\n`;
    case 'error':
      return `import {isRouteErrorResponse, useRouteError} from 'react-router';\n\nexport default function ${symbol}Error() {\n  const error = useRouteError();\n  const message = isRouteErrorResponse(error) ? error.statusText : error instanceof Error ? error.message : 'Unknown error';\n  return <main><h1>Something went wrong</h1><p>{message}</p></main>;\n}\n`;
    case 'not-found':
      return `export default function ${symbol}NotFound() {\n  return <main><h1>404</h1><p>Page not found.</p></main>;\n}\n`;
    case 'forbidden':
      return `export default function ${symbol}Forbidden() {\n  return <main><h1>403</h1><p>Access forbidden.</p></main>;\n}\n`;
    case 'unauthorized':
      return `export default function ${symbol}Unauthorized() {\n  return <main><h1>401</h1><p>Authentication required.</p></main>;\n}\n`;
    case 'component':
      return `export function ${symbol}({children}${typescript ? `: {children?: React.ReactNode}` : ''}) {\n  return <div>{children}</div>;\n}\n`;
    case 'action':
      return `'use server';\n\nexport async function ${symbol}(formData${typescript ? ': FormData' : ''}) {\n  return {ok: true, data: Object.fromEntries(formData)};\n}\n`;
    case 'middleware':
      return `export default async function ${symbol}({request}${typescript ? ': {request: Request}' : ''}, next${typescript ? ': () => Promise<Response>' : ''}) {\n  const response = await next();\n  response.headers.set('x-ness-middleware', '${symbol}');\n  return response;\n}\n`;
    case 'service':
      return `import {Injectable} from '@nestjs/common';\n\n@Injectable()\nexport class ${symbol}Service {\n  async findAll() {\n    return [];\n  }\n}\n`;
    case 'module':
      return `import {Module} from '@nestjs/common';\n\n@Module({})\nexport class ${symbol}Module {}\n`;
    case 'hook':
      return `import {useState} from 'react';\n\nexport function use${symbol}() {\n  const [enabled, setEnabled] = useState${typescript ? '<boolean>' : ''}(false);\n  return {enabled, setEnabled};\n}\n`;
    case 'context':
      return `import {createContext, useContext} from 'react';${typescript ? "\nimport type {ReactNode} from 'react';" : ''}\n\nconst ${symbol}Context = createContext${typescript ? '<unknown | undefined>' : ''}(undefined);\n\nexport function ${symbol}Provider({value, children}${typescript ? ': {value: unknown; children: ReactNode}' : ''}) {\n  return <${symbol}Context.Provider value={value}>{children}</${symbol}Context.Provider>;\n}\n\nexport function use${symbol}() {\n  const value = useContext(${symbol}Context);\n  if (value === undefined) throw new Error('use${symbol} must be used inside ${symbol}Provider');\n  return value;\n}\n`;
    case 'model':
      return typescript
        ? `export interface ${symbol} {\n  id: string;\n}\n\nexport type Create${symbol} = Omit<${symbol}, 'id'>;\n`
        : `export function create${symbol}(values) {\n  return {id: crypto.randomUUID(), ...values};\n}\n`;
    case 'guard':
      return `import {type CanActivate, type ExecutionContext, Injectable} from '@nestjs/common';\n\n@Injectable()\nexport class ${symbol}Guard implements CanActivate {\n  canActivate(context: ExecutionContext) {\n    const request = context.switchToHttp().getRequest();\n    return Boolean(request.headers.authorization);\n  }\n}\n`;
    case 'class':
      return typescript
        ? `export class ${symbol} {\n  constructor(readonly options: Record<string, unknown> = {}) {}\n}\n`
        : `export class ${symbol} {\n  constructor(options = {}) {\n    this.options = options;\n  }\n}\n`;
    case 'interface':
      return typescript
        ? `export interface ${symbol} {\n  id: string;\n}\n`
        : `/** @typedef {{id: string}} ${symbol} */\nexport const ${symbol}Shape = {};\n`;
    case 'enum':
      return typescript
        ? `export enum ${symbol} {\n  Default = 'default',\n}\n`
        : `export const ${symbol} = Object.freeze({\n  Default: 'default',\n});\n`;
    case 'test':
      return `import assert from 'node:assert/strict';\nimport test from 'node:test';\n\ntest(${JSON.stringify(name)}, () => {\n  assert.equal(true, true);\n});\n`;
  }
}

function generatorFilename(
  type: GeneratorType,
  name: string,
  cwd: string,
  typescript: boolean,
): string {
  const jsxExtension = typescript ? 'tsx' : 'jsx';
  const codeExtension = typescript ? 'ts' : 'js';
  if (type === 'component') {
    return path.join(cwd, 'app', 'components', `${name}.${jsxExtension}`);
  }
  if (type === 'action') {
    return path.join(cwd, 'app', 'actions', `${name}.server.${codeExtension}`);
  }
  if (type === 'middleware') {
    return path.join(cwd, 'app', 'middleware', `${name}.${codeExtension}`);
  }
  const nestName = path.basename(name);
  if (type === 'controller' || type === 'resource') {
    return path.join(cwd, 'app', 'server', name, `${nestName}.controller.ts`);
  }
  if (type === 'service') {
    return path.join(cwd, 'app', 'server', name, `${nestName}.service.ts`);
  }
  if (type === 'module') {
    return path.join(cwd, 'app', 'server', name, `${nestName}.module.ts`);
  }
  if (type === 'hook') {
    return path.join(cwd, 'app', 'hooks', `${name}.${codeExtension}`);
  }
  if (type === 'context') {
    return path.join(cwd, 'app', 'context', `${name}.context.${jsxExtension}`);
  }
  if (type === 'model') {
    return path.join(cwd, 'app', 'models', `${name}.server.${codeExtension}`);
  }
  if (type === 'guard') {
    return path.join(cwd, 'app', 'server', name, `${nestName}.guard.ts`);
  }
  if (type === 'class') {
    return path.join(cwd, 'app', 'lib', `${name}.${codeExtension}`);
  }
  if (type === 'interface' || type === 'enum') {
    return path.join(cwd, 'app', 'types', `${name}.${codeExtension}`);
  }
  if (type === 'test') {
    return path.join(cwd, 'test', `${name}.test.${codeExtension}`);
  }
  return path.join(
    cwd,
    'app',
    'routes',
    name,
    `${type}.${type === 'route' ? codeExtension : jsxExtension}`,
  );
}

function registerNestProvider(
  type: GeneratorType,
  name: string,
  filename: string,
  cwd: string,
  dryRun: boolean | undefined,
): void {
  const registrations: Partial<Record<GeneratorType, [string, string]>> = {
    controller: ['controllers', 'Controller'],
    resource: ['controllers', 'Controller'],
    service: ['providers', 'Service'],
    module: ['imports', 'Module'],
    guard: ['providers', 'Guard'],
  };
  const registration = registrations[type];
  if (!registration) return;
  const appModule = ['app.module.ts', 'app.module.mts', 'app.module.js']
    .map(candidate => path.join(cwd, 'app', 'server', candidate))
    .find(fs.existsSync);
  if (!appModule) return;

  const [field, suffix] = registration;
  const symbol = `${componentName(path.basename(name))}${suffix}`;
  let source = fs.readFileSync(appModule, 'utf8');
  if (source.includes(`{ ${symbol} }`)) return;
  const importPath = `./${path
    .relative(path.dirname(appModule), filename)
    .replaceAll(path.sep, '/')
    .replace(/\.(?:ts|mts|js)$/, '.js')}`;
  const importStatement = `import { ${symbol} } from '${importPath}';`;
  const imports = [...source.matchAll(/^import .*;$/gm)];
  const last = imports.at(-1);
  const insertion = last ? last.index + last[0].length : 0;
  source = `${source.slice(0, insertion)}${insertion ? '\n' : ''}${importStatement}${source.slice(insertion)}`;

  const fieldPattern = new RegExp(`(${field}\\s*:\\s*\\[)([^\\]]*)(\\])`);
  if (fieldPattern.test(source)) {
    source = source.replace(
      fieldPattern,
      (_match: string, start: string, values: string, end: string) => {
        const existing = values.trim();
        return `${start}${existing ? `${existing}, ` : ''}${symbol}${end}`;
      },
    );
  } else {
    source = source.replace(/(@?Module\(\{)\s*/, `$1 ${field}: [${symbol}], `);
  }
  if (!dryRun) fs.writeFileSync(appModule, source);
  console.log(
    `${paint(dryRun ? 'yellow' : 'green', dryRun ? 'Would update' : 'Updated')} ${path.relative(cwd, appModule)}`,
  );
}

export function generate(
  rawType: string,
  rawName: string,
  cwdOrOptions: string | GenerateOptions = process.cwd(),
  generatorOptions: GenerateOptions = {},
): string {
  const type = resolveGeneratorType(rawType);
  const name = safeGeneratorName(rawName);
  const options: GenerateOptions =
    typeof cwdOrOptions === 'string'
      ? { ...generatorOptions, cwd: cwdOrOptions }
      : cwdOrOptions;
  const cwd = path.resolve(options.cwd || process.cwd());
  const typescript = projectUsesTypeScript(cwd);
  const filename = generatorFilename(type, name, cwd, typescript);
  if (fs.existsSync(filename) && !options.force) {
    throw new Error(`Refusing to overwrite existing file: ${filename}`);
  }
  if (!options.dryRun) {
    fs.ensureDirSync(path.dirname(filename));
    fs.writeFileSync(filename, generatorSource(type, name, typescript));
  }
  console.log(
    `${paint(options.dryRun ? 'yellow' : 'green', options.dryRun ? 'Would create' : 'Created')} ${path.relative(cwd, filename)}`,
  );
  registerNestProvider(type, name, filename, cwd, options.dryRun);
  return filename;
}

export { GENERATOR_TYPES };
