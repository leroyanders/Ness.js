import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer, get } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildNestApplication, createNestMiddleware } from '../src/index.js';

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

test('Nest routes require an isolated URL prefix', async () => {
  await assert.rejects(
    createNestMiddleware({ prefix: '' }),
    /prefix must be non-empty/,
  );
});
