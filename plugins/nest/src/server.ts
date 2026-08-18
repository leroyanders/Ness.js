import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import 'reflect-metadata';
import type { NestOptions } from './index.js';

/** A connect-style handler, which is what Nest's express adapter produces. */
export type NestHandler = (
  request: unknown,
  response: unknown,
  next: () => void,
) => void;

export interface NestMiddleware {
  application: INestApplication;
  middleware: NestHandler;
  handler: NestHandler;
}

export interface NestMiddlewareOptions {
  /** An AppModule class, or a module namespace containing one. */
  module?: unknown;
  /** A path to import the AppModule from instead. */
  modulePath?: string;
  prefix?: string;
  logger?: NestOptions['logger'];
}

function resolveModule(module: unknown): unknown {
  const candidate = module as
    { AppModule?: unknown; default?: unknown } | undefined;
  return candidate?.AppModule || candidate?.default || module;
}

function normalizePrefix(prefix: string | undefined): string {
  const normalized = String(prefix || '').replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    throw new TypeError(
      'The Nest route prefix must be non-empty so React routes can fall through.',
    );
  }
  return normalized;
}

function scopeMiddleware(middleware: NestHandler, prefix: string): NestHandler {
  const pathname = `/${prefix}`;
  return function nestMiddleware(request, response, next) {
    const requestPath = String((request as { url?: string }).url || '').split(
      '?',
    )[0];
    if (requestPath !== pathname && !requestPath?.startsWith(`${pathname}/`)) {
      return next();
    }
    return middleware(request, response, next);
  };
}

export async function createNestMiddleware({
  module,
  modulePath,
  prefix = 'api',
  logger = ['error', 'warn', 'log'],
}: NestMiddlewareOptions = {}): Promise<NestMiddleware> {
  const routePrefix = normalizePrefix(prefix);
  const loadedModule = modulePath
    ? await import(
        /* @vite-ignore */
        `${pathToFileURL(path.resolve(modulePath)).href}?t=${Date.now()}`
      )
    : module;
  const rootModule = resolveModule(loadedModule);
  if (typeof rootModule !== 'function') {
    throw new TypeError('A Nest AppModule class is required.');
  }

  const middleware = express();
  middleware.disable('x-powered-by');
  const application = await NestFactory.create(
    // `typeof x === 'function'` narrows to `Function`, which is not
    // constructible as far as the checker is concerned; Nest wants the class.
    rootModule as Parameters<typeof NestFactory.create>[0],
    new ExpressAdapter(middleware),
    // rawBody: true stashes the unparsed request Buffer on `request.rawBody`
    // (via RawBodyRequest<Request> from @nestjs/common) alongside the normal
    // parsed body — needed for webhook signature verification (HMAC/ECDSA
    // schemes that sign the exact byte sequence, not a re-serialized JSON).
    { logger, rawBody: true },
  );
  application.setGlobalPrefix(routePrefix);
  await application.init();
  const handler = middleware as unknown as NestHandler;
  return {
    application,
    middleware: handler,
    handler: scopeMiddleware(handler, routePrefix),
  };
}

export function nestServer(
  options: NestOptions & { module?: string } = {},
): (
  server: { use(handler: unknown): void },
  context?: { root?: string },
) => Promise<() => Promise<void>> {
  return async function configureNestServer(
    server,
    { root = process.cwd() }: { root?: string } = {},
  ) {
    const modulePath = path.resolve(
      root,
      options.module || 'build/nest/app.module.js',
    );
    const nest = await createNestMiddleware({ ...options, modulePath });
    server.use(nest.handler);
    return () => nest.application.close();
  };
}
