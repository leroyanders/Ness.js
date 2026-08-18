import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Everything a request carries with it that is not the `Request` itself:
 * work deferred past the response, the flag that takes the response out of
 * the shared cache, and the per-request fetch memo.
 *
 * One AsyncLocalStorage store per request, entered by
 * `createNessRequestHandler` before anything of the application runs. The
 * functions in this module read it implicitly, which is the entire point —
 * `after()` and `noStore()` are called from loaders and components that were
 * never handed a request object and should not have to be.
 */
export interface RequestStore {
  request: Request;
  /** Callbacks to run once the response body has been fully sent. */
  deferred: Array<() => Promise<unknown> | unknown>;
  /** Promises the platform must not freeze before (Workers/Lambda). */
  pending: Promise<unknown>[];
  /**
   * The platform's own `waitUntil`, when it has one. A Worker freezes the
   * isolate the moment the response is done; work merely queued would never
   * run there.
   */
  waitUntil?: ((promise: Promise<unknown>) => void) | undefined;
  /** Set by `noStore()`/`connection()`: this response is per-request. */
  dynamic: boolean;
  /** Per-request fetch memoization, keyed by method+url+body. */
  fetchMemo: Map<string, Promise<Response>>;
  /** The segment's `fetchCache` default, when it declared one. */
  fetchCacheDefault?: 'default-cache' | 'default-no-store' | undefined;
  /** A per-call load context from the platform adapter (Workers bindings). */
  loadContext?: unknown;
}

const storage = new AsyncLocalStorage<RequestStore>();

function createRequestStore(
  request: Request,
  options: {
    waitUntil?: ((promise: Promise<unknown>) => void) | undefined;
    loadContext?: unknown;
  } = {},
): RequestStore {
  return {
    request,
    deferred: [],
    pending: [],
    waitUntil: options.waitUntil,
    dynamic: false,
    fetchMemo: new Map(),
    loadContext: options.loadContext,
  };
}

/** Runs `fn` with `store` as the ambient request context. */
function runWithRequestStore<T>(store: RequestStore, fn: () => T): T {
  return storage.run(store, fn);
}

/** The ambient request store, or undefined outside a request. */
function requestStore(): RequestStore | undefined {
  return storage.getStore();
}

/**
 * Schedules work for after the response has been sent.
 *
 * Inside a request, the callback runs once the response body has finished
 * streaming — the user never waits on it, and on platforms with a real
 * `waitUntil` (Workers, Lambda streaming) the runtime is told to stay alive
 * for it. Outside a request it falls back to `setImmediate`, so the function
 * is safe to call from code that also runs in scripts and tests.
 */
function after<T>(callback: () => Promise<T> | T): void {
  if (typeof callback !== 'function')
    throw new TypeError('after() expects a callback.');
  const store = storage.getStore();
  if (!store) {
    setImmediate(() => {
      Promise.resolve()
        .then(callback)
        .catch((error: unknown) => console.error('[ness] after()', error));
    });
    return;
  }
  store.deferred.push(callback);
}

/**
 * Keeps the runtime alive until `promise` settles, without delaying the
 * response. On Node this is bookkeeping; on Workers and Lambda the platform's
 * own `waitUntil` is what actually prevents the freeze.
 */
function waitUntil(promise: Promise<unknown>): void {
  const store = storage.getStore();
  const tracked = promise.catch((error: unknown) =>
    console.error('[ness] waitUntil()', error),
  );
  if (!store) return;
  store.pending.push(tracked);
  store.waitUntil?.(tracked);
}

/**
 * Opts this response out of every shared cache: the page cache will neither
 * store it nor serve a stored copy in its place, and `fetch()` calls made
 * while it is in effect default to `no-store`.
 */
function noStore(): void {
  const store = storage.getStore();
  if (store) store.dynamic = true;
}

/**
 * Waits for a real request. Same statement as `noStore()` — this render is
 * per-request — expressed the way Next spells it, so code that guards
 * `Math.random()` or a DB read behind `await connection()` ports unchanged.
 * During prerendering there is no request store, and the returned promise
 * still resolves: a prerender that reaches this line renders once at build
 * time, which is exactly what it rendered before the guard existed.
 */
async function connection(): Promise<void> {
  noStore();
}

/** Whether `noStore()`/`connection()` fired during this request. */
function isDynamicRequest(): boolean {
  return storage.getStore()?.dynamic === true;
}

/**
 * Runs every `after()` callback and waits for `waitUntil` promises. Called by
 * the request handler once the response body has closed; not part of the
 * public surface.
 */
async function flushRequestStore(store: RequestStore): Promise<void> {
  for (const callback of store.deferred.splice(0)) {
    try {
      await callback();
    } catch (error) {
      console.error('[ness] after()', error);
    }
  }
  await Promise.allSettled(store.pending.splice(0));
}

// ---------------------------------------------------------------------------
// Taint
// ---------------------------------------------------------------------------

/**
 * Objects that must never reach the client, and the message to fail with.
 *
 * A WeakMap so tainting cannot keep the object alive: the registry remembers
 * the object exactly as long as the application does.
 */
const taintedObjects = new WeakMap<object, string>();

/** Values (strings, bigints) that must never reach the client. */
const taintedValues = new Map<unknown, string>();

/**
 * Marks an object so that returning it — or anything containing it — from a
 * loader fails the request instead of serializing the object to the client.
 *
 * The check runs where the data crosses the boundary: the generated route
 * wrappers pass loader results through `assertUntainted` before React Router
 * serializes them.
 */
function taintObjectReference(message: string, object: object): void {
  if (object === null || typeof object !== 'object')
    throw new TypeError(
      'taintObjectReference expects an object; use taintUniqueValue for primitives.',
    );
  taintUsed = true;
  taintedObjects.set(object, message);
}

/**
 * Marks a unique value — a token, a key — so any loader data containing it
 * fails the request. `lifetime` keeps the entry from outliving the object it
 * belongs to: when the lifetime object is collected, the value is forgotten.
 */
function taintUniqueValue(
  message: string,
  lifetime: object,
  value: string | bigint,
): void {
  if (typeof value !== 'string' && typeof value !== 'bigint')
    throw new TypeError('taintUniqueValue expects a string or bigint.');
  if (typeof value === 'string' && value.length < 8)
    throw new TypeError(
      'taintUniqueValue refuses values shorter than 8 characters: they collide with ordinary data.',
    );
  taintedValues.set(value, message);
  registry?.register(lifetime, value);
}

/** Forgets a tainted value once its lifetime object is collected. */
const registry =
  typeof FinalizationRegistry === 'function'
    ? new FinalizationRegistry<unknown>(value => {
        taintedValues.delete(value);
      })
    : undefined;

/**
 * True once anything has ever been tainted. A WeakMap cannot report its own
 * size, so the flag is what lets an application that never taints skip the
 * deep scan entirely.
 */
let taintUsed = false;

function hasTaintEntries(): boolean {
  return taintUsed || taintedValues.size > 0;
}

/**
 * Deep-scans `value` for tainted objects and values, throwing the taint
 * message on a hit. Cycles are cut with a Set; the scan is skipped entirely
 * when the application never tainted anything.
 */
function assertUntainted<T>(value: T, seen = new Set<object>()): T {
  if (!hasTaintEntries()) return value;
  scan(value, seen);
  return value;
}

function scan(value: unknown, seen: Set<object>): void {
  if (typeof value === 'string' || typeof value === 'bigint') {
    const message = taintedValues.get(value);
    if (message !== undefined) throw new Error(message);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  const message = taintedObjects.get(value);
  if (message !== undefined) throw new Error(message);
  if (Array.isArray(value)) {
    for (const entry of value) scan(entry, seen);
    return;
  }
  if (value instanceof Map) {
    for (const [key, entry] of value) {
      scan(key, seen);
      scan(entry, seen);
    }
    return;
  }
  if (value instanceof Set) {
    for (const entry of value) scan(entry, seen);
    return;
  }
  // Only own enumerable properties: the same surface structuredClone and the
  // router's serializer walk.
  for (const key of Object.keys(value)) {
    scan((value as Record<string, unknown>)[key], seen);
  }
}

export {
  after,
  assertUntainted,
  connection,
  // The name Next code arrives with; same function.
  noStore as unstable_noStore,
  createRequestStore,
  flushRequestStore,
  isDynamicRequest,
  noStore,
  requestStore,
  runWithRequestStore,
  taintObjectReference,
  taintUniqueValue,
  waitUntil,
};
