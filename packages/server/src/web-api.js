import fetch, { File, FormData, Headers, Request, Response } from 'node-fetch';

function installWebApiGlobals() {
  const globals = { File, FormData, Headers, Request, Response, fetch };
  for (const [name, implementation] of Object.entries(globals)) {
    if (globalThis[name] === undefined && implementation !== undefined) {
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
