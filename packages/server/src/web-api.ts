import fetch, { File, FormData, Headers, Request, Response } from 'node-fetch';

function installWebApiGlobals(): void {
  const globals: Record<string, unknown> = {
    File,
    FormData,
    Headers,
    Request,
    Response,
    fetch,
  };
  const target = globalThis as unknown as Record<string, unknown>;
  for (const [name, implementation] of Object.entries(globals)) {
    if (target[name] === undefined && implementation !== undefined) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        value: implementation,
        writable: true,
      });
    }
  }
}

installWebApiGlobals();

export { installWebApiGlobals };
