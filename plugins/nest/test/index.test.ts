import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer, get, request as httpRequest } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { buildNestApplication, createNestMiddleware } from '../dist/index.js';

function request(url) {
  return new Promise((resolve, reject) => {
    get(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => resolve({ body, status: response.statusCode }));
    }).on('error', reject);
  });
}

test('Nest plugin compiles decorators and serves controller routes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-nest-'));
  let nest;
  let server;
  try {
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    fs.symlinkSync(
      path.join(process.cwd(), 'node_modules'),
      path.join(root, 'node_modules'),
      'dir',
    );
    const source = path.join(root, 'app', 'server');
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(
      path.join(source, 'app.module.ts'),
      `import {Controller, Get, Module} from '@nestjs/common';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return {healthy: true};
  }
}

@Module({controllers: [HealthController]})
export class AppModule {}
`,
    );

    const entry = await buildNestApplication({ root });
    assert.ok(entry);
    const compiled = fs.readFileSync(entry, 'utf8');
    assert.match(compiled, /__decorate/);
    assert.match(compiled, /__metadata/);
    assert.match(compiled, /import \{ Controller, Get, Module \}/);
    assert.doesNotMatch(compiled, /\b(?:exports|require)\b/);

    nest = await createNestMiddleware({ modulePath: entry });
    server = createServer((request, response) => {
      nest.handler(request, response, () => {
        response.statusCode = 418;
        response.end('fallback');
      });
    });
    server.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));

    const address = server.address();
    const response = await request(
      `http://127.0.0.1:${address.port}/api/health`,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.body), { healthy: true });
    const fallback = await request(`http://127.0.0.1:${address.port}/`);
    assert.equal(fallback.status, 418);
    assert.equal(fallback.body, 'fallback');
  } finally {
    await nest?.application.close();
    if (server?.listening) {
      await new Promise(resolve => server.close(resolve));
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/**
 * The single-file test above cannot see this: the compiled output is ESM, and
 * Node refuses a relative import with no extension. TypeScript accepts one
 * under `moduleResolution: 'bundler'` — what the templates configure — and
 * `transpileModule` copies the specifier out as written, so the build succeeded
 * and every template crashed at boot with ERR_MODULE_NOT_FOUND. The assertion
 * that matters is the `import()`: reading the text would pass against output
 * Node still cannot load.
 */
test('Nest build emits imports Node can resolve', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-nest-esm-'));
  try {
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    fs.symlinkSync(
      path.join(process.cwd(), 'node_modules'),
      path.join(root, 'node_modules'),
      'dir',
    );
    const source = path.join(root, 'app', 'server');
    fs.mkdirSync(path.join(source, 'users'), { recursive: true });

    // Extensionless, extensioned, a nested directory index, a dynamic import,
    // and a specifier that only looks like one because it sits inside a string.
    fs.writeFileSync(
      path.join(source, 'app.module.ts'),
      `import {Module} from '@nestjs/common';
import {HealthController} from './health.controller';
import {UsersController} from './users';
import {LABEL} from './label.js';

export const note = 'see ./health.controller for details';
export const lazy = () => import('./health.controller');

@Module({controllers: [HealthController, UsersController]})
export class AppModule {}
export {LABEL};
`,
    );
    fs.writeFileSync(
      path.join(source, 'health.controller.ts'),
      `import {Controller, Get} from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {healthy: true};
  }
}
`,
    );
    fs.writeFileSync(
      path.join(source, 'users', 'index.ts'),
      `import {Controller, Get} from '@nestjs/common';

@Controller()
export class UsersController {
  @Get('users')
  users() {
    return [];
  }
}
`,
    );
    // Hand-written JavaScript is copied rather than compiled, and breaks the
    // same way.
    fs.writeFileSync(
      path.join(source, 'label.js'),
      `import {NAME} from './name';\nexport const LABEL = NAME;\n`,
    );
    fs.writeFileSync(
      path.join(source, 'name.js'),
      `export const NAME = 'ok';\n`,
    );

    const entry = await buildNestApplication({ root });
    const compiled = fs.readFileSync(entry, 'utf8');
    assert.match(compiled, /'\.\/health\.controller\.js'/);
    assert.match(compiled, /'\.\/users\/index\.js'/);
    assert.match(compiled, /import\('\.\/health\.controller\.js'\)/);
    // Already correct, and not doubled into `.js.js`.
    assert.match(compiled, /'\.\/label\.js'/);
    assert.doesNotMatch(compiled, /\.js\.js/);
    // The string is not an import and must survive untouched.
    assert.match(compiled, /see \.\/health\.controller for details/);
    assert.match(
      fs.readFileSync(path.join(root, 'build', 'nest', 'label.js'), 'utf8'),
      /'\.\/name\.js'/,
    );

    const module = await import(pathToFileURL(entry).href);
    assert.ok(module.AppModule, 'the built module loads under Node');
    assert.equal(module.LABEL, 'ok');
    assert.ok((await module.lazy()).HealthController);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Nest routes require an isolated URL prefix', async () => {
  await assert.rejects(
    createNestMiddleware({ prefix: '' }),
    /prefix must be non-empty/,
  );
});

function post(url, body) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      url,
      { method: 'POST', headers: { 'content-type': 'application/json' } },
      response => {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', chunk => {
          responseBody += chunk;
        });
        response.on('end', () =>
          resolve({ body: responseBody, status: response.statusCode }),
        );
      },
    ).on('error', reject);
    req.end(body);
  });
}

// Webhook signature verification (e.g. Monobank's ECDSA-over-raw-bytes
// scheme, unlike LiqPay's sign-the-data-field design) needs the exact byte
// sequence the client sent — the parsed-then-restringified `@Body()` object
// is not guaranteed to match key order/whitespace. `rawBody: true` is the
// only thing standing between a route and always-invalid signatures.
test('Nest middleware exposes the raw request body alongside the parsed one', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-nest-rawbody-'));
  let nest;
  let server;
  try {
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    fs.symlinkSync(
      path.join(process.cwd(), 'node_modules'),
      path.join(root, 'node_modules'),
      'dir',
    );
    const source = path.join(root, 'app', 'server');
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(
      path.join(source, 'app.module.ts'),
      `import {Body, Controller, Module, Post, Req} from '@nestjs/common';

@Controller()
class EchoController {
  @Post('echo')
  echo(@Req() request, @Body() body) {
    return {
      rawBodyText: request.rawBody ? request.rawBody.toString('utf8') : null,
      isBuffer: Buffer.isBuffer(request.rawBody),
      parsed: body,
    };
  }
}

@Module({controllers: [EchoController]})
export class AppModule {}
`,
    );

    const entry = await buildNestApplication({ root });
    nest = await createNestMiddleware({ modulePath: entry });
    server = createServer((request, response) => {
      nest.handler(request, response, () => {
        response.statusCode = 404;
        response.end();
      });
    });
    server.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));

    const address = server.address();
    const sentBody = '{"invoiceId":"p2_test","status":"success"}';
    const response = await post(
      `http://127.0.0.1:${address.port}/api/echo`,
      sentBody,
    );
    assert.equal(response.status, 201);
    const parsedResponse = JSON.parse(response.body);
    assert.equal(parsedResponse.rawBodyText, sentBody);
    assert.equal(parsedResponse.isBuffer, true);
    assert.deepEqual(parsedResponse.parsed, {
      invoiceId: 'p2_test',
      status: 'success',
    });
  } finally {
    await nest?.application.close();
    if (server?.listening) {
      await new Promise(resolve => server.close(resolve));
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});
