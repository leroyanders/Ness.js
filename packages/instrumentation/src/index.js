const hooks = new Set();
let registered = false;

function registerInstrumentation(instrumentation) {
  if (!instrumentation) return () => {};
  hooks.add(instrumentation);
  return () => hooks.delete(instrumentation);
}

async function register() {
  if (registered) return;
  registered = true;
  for (const instrumentation of hooks) {
    if (typeof instrumentation.register === 'function')
      await instrumentation.register();
  }
}

async function emit(name, payload) {
  for (const instrumentation of hooks) {
    if (typeof instrumentation[name] === 'function')
      await instrumentation[name](payload);
  }
}

/**
 * Whether anything is listening for a hook.
 *
 * Used to decide whether a fallback is still needed: an error nobody is
 * reporting should keep reaching the console, and one that is being reported
 * should not be logged twice.
 */
function hasHook(name) {
  for (const instrumentation of hooks) {
    if (typeof instrumentation[name] === 'function') return true;
  }
  return false;
}

function createConsoleInstrumentation({
  logger = console,
  includeHeaders = false,
} = {}) {
  return {
    onRequest({ request, id }) {
      logger.info(
        `[ness:${id}] ${request.method} ${new URL(request.url).pathname}`,
      );
    },
    onResponse({ response, duration, id }) {
      logger.info(`[ness:${id}] ${response.status} ${duration.toFixed(1)}ms`);
      if (includeHeaders) logger.debug(Object.fromEntries(response.headers));
    },
    onError({ error, id }) {
      logger.error(`[ness:${id}]`, error);
    },
  };
}

function reportWebVitals(callback) {
  if (
    typeof window === 'undefined' ||
    typeof PerformanceObserver === 'undefined'
  )
    return () => {};
  const observers = [];
  const observe = (type, handler) => {
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
    for (const entry of entries) if (!entry.hadRecentInput) cls += entry.value;
    callback({ name: 'CLS', value: cls, entry: entries.at(-1) });
  });
  observe('event', entries => {
    const entry = entries.reduce(
      (worst, current) =>
        !worst || current.duration > worst.duration ? current : worst,
      undefined,
    );
    if (entry) callback({ name: 'INP', value: entry.duration, entry });
  });
  const navigation = performance.getEntriesByType('navigation')[0];
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
