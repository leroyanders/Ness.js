export interface Instrumentation {
  register?(): unknown | Promise<unknown>;
  onRequest?(payload: Record<string, unknown>): unknown | Promise<unknown>;
  onResponse?(payload: Record<string, unknown>): unknown | Promise<unknown>;
  onError?(payload: Record<string, unknown>): unknown | Promise<unknown>;
}
export function registerInstrumentation(value: Instrumentation): () => void;
export function register(): Promise<void>;
/** Whether any registered instrumentation implements this hook. */
export function hasHook(name: string): boolean;
export function emit(
  name: keyof Instrumentation,
  payload: Record<string, unknown>,
): Promise<void>;
export function createConsoleInstrumentation(options?: {
  logger?: Console;
  includeHeaders?: boolean;
}): Instrumentation;
export function reportWebVitals(
  callback: (metric: {
    name: string;
    value: number;
    entry: PerformanceEntry;
  }) => void,
): () => void;
