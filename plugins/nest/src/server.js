import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import 'reflect-metadata';

function resolveModule(module) {
  return module?.AppModule || module?.default || module;
}

function normalizePrefix(prefix) {
  const normalized = String(prefix || '').replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    throw new TypeError(
      'The Nest route prefix must be non-empty so React routes can fall through.',
    );
  }
  return normalized;
}

function scopeMiddleware(middleware, prefix) {
  const pathname = `/${prefix}`;
  return function nestMiddleware(request, response, next) {
    const requestPath = String(request.url || '').split('?')[0];
    if (requestPath !== pathname && !requestPath.startsWith(`${pathname}/`)) {
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
} = {}) {
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
    rootModule,
    new ExpressAdapter(middleware),
    // rawBody: true stashes the unparsed request Buffer on `request.rawBody`
    // (via RawBodyRequest<Request> from @nestjs/common) alongside the normal
    // parsed body — needed for webhook signature verification (HMAC/ECDSA
    // schemes that sign the exact byte sequence, not a re-serialized JSON).
    { logger, rawBody: true },
  );
  application.setGlobalPrefix(routePrefix);
  await application.init();
  return {
    application,
    middleware,
    handler: scopeMiddleware(middleware, routePrefix),
  };
}

export function nestServer(options = {}) {
  return async function configureNestServer(
    server,
    { root = process.cwd() } = {},
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
