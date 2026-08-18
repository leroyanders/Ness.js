export interface Instrumentation {
  register?(): unknown | Promise<unknown>;
  onRequest?(payload: Record<string, unknown>): unknown | Promise<unknown>;
  onResponse?(payload: Record<string, unknown>): unknown | Promise<unknown>;
  onError?(payload: Record<string, unknown>): unknown | Promise<unknown>;
}

export interface WebVitalsMetric {
  name: string;
  value: number;
  entry: PerformanceEntry | undefined;
}

export interface ConsoleInstrumentationOptions {
  logger?: Console;
  includeHeaders?: boolean;
}

type HookName = keyof Instrumentation;
type Hook = (payload: Record<string, unknown>) => unknown;

const hooks = new Set<Instrumentation>();
let registered = false;

function registerInstrumentation(instrumentation: Instrumentation): () => void {
  if (!instrumentation) return () => {};
  hooks.add(instrumentation);
  return () => {
    hooks.delete(instrumentation);
  };
}

async function register(): Promise<void> {
  if (registered) return;
  registered = true;
  for (const instrumentation of hooks) {
    if (typeof instrumentation.register === 'function')
      await instrumentation.register();
  }
}

async function emit(
  name: HookName,
  payload: Record<string, unknown>,
): Promise<void> {
  for (const instrumentation of hooks) {
    const hook = instrumentation[name] as Hook | undefined;
    if (typeof hook === 'function') await hook.call(instrumentation, payload);
  }
}

/**
 * Whether anything is listening for a hook.
 *
 * Used to decide whether a fallback is still needed: an error nobody is
 * reporting should keep reaching the console, and one that is being reported
 * should not be logged twice.
 */
function hasHook(name: string): boolean {
  for (const instrumentation of hooks) {
    if (
      typeof (instrumentation as Record<string, unknown>)[name] === 'function'
    )
      return true;
  }
  return false;
}

function createConsoleInstrumentation({
  logger = console,
  includeHeaders = false,
}: ConsoleInstrumentationOptions = {}): Instrumentation {
  return {
    onRequest({ request, id }) {
      const incoming = request as Request;
      logger.info(
        `[ness:${String(id)}] ${incoming.method} ${new URL(incoming.url).pathname}`,
      );
    },
    onResponse({ response, duration, id }) {
      const outgoing = response as Response;
      logger.info(
        `[ness:${String(id)}] ${outgoing.status} ${(duration as number).toFixed(1)}ms`,
      );
      if (includeHeaders) logger.debug(Object.fromEntries(outgoing.headers));
    },
    onError({ error, id }) {
      logger.error(`[ness:${String(id)}]`, error);
    },
  };
}

/** Reported by the layout-shift and event-timing entries, which the DOM lib
 * does not describe. */
interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

function reportWebVitals(
  callback: (metric: WebVitalsMetric) => void,
): () => void {
  if (
    typeof window === 'undefined' ||
    typeof PerformanceObserver === 'undefined'
  )
    return () => {};
  const observers: PerformanceObserver[] = [];
  const observe = (
    type: string,
    handler: (entries: PerformanceEntryList) => void,
  ) => {
    try {
      const observer = new PerformanceObserver(list =>
        handler(list.getEntries()),
      );
      observer.observe({ type, buffered: true });
      observers.push(observer);
    } catch {}
  };
  observe('paint', entries => {
    for (const entry of entries)
      if (entry.name === 'first-contentful-paint')
        callback({ name: 'FCP', value: entry.startTime, entry });
  });
  observe('largest-contentful-paint', entries => {
    const entry = entries.at(-1);
    if (entry) callback({ name: 'LCP', value: entry.startTime, entry });
  });
  let cls = 0;
  observe('layout-shift', entries => {
    for (const entry of entries as LayoutShiftEntry[])
      if (!entry.hadRecentInput) cls += entry.value;
    callback({ name: 'CLS', value: cls, entry: entries.at(-1) });
  });
  observe('event', entries => {
    const entry = entries.reduce<PerformanceEntry | undefined>(
      (worst, current) =>
        !worst || current.duration > worst.duration ? current : worst,
      undefined,
    );
    if (entry) callback({ name: 'INP', value: entry.duration, entry });
  });
  const navigation = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  if (navigation)
    callback({
      name: 'TTFB',
      value: navigation.responseStart,
      entry: navigation,
    });
  return () => observers.forEach(observer => observer.disconnect());
}

export {
  createConsoleInstrumentation,
  emit,
  hasHook,
  register,
  registerInstrumentation,
  reportWebVitals,
};
