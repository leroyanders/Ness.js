import type { ComponentProps, ReactNode } from 'react';
import type { Form as RouterForm } from 'react-router';

/* Hydration ---------------------------------------------------------------- */

/** True once hydrated. False on the server and on the first client render. */
export function useHydrated(): boolean;

export interface ClientOnlyProps {
  children: ReactNode | (() => ReactNode);
  /** Rendered on the server and until hydration. Match its footprint. */
  fallback?: ReactNode;
}

/** Renders children only after hydration, for genuinely browser-only UI. */
export function ClientOnly(props: ClientOnlyProps): ReactNode;

/* Streaming ---------------------------------------------------------------- */

export interface StreamedProps<T> {
  /** A promise a loader returned without awaiting. */
  value: Promise<T> | T;
  children: (value: T) => ReactNode;
  fallback?: ReactNode;
  /** Keeps a rejection local instead of reaching the route boundary. */
  error?: ReactNode | ((error: unknown, message: string) => ReactNode);
}

export function Streamed<T>(props: StreamedProps<T>): ReactNode;

/* Pending state ------------------------------------------------------------ */

export interface Activity {
  state: 'idle' | 'loading' | 'submitting';
  idle: boolean;
  navigating: boolean;
  submitting: boolean;
  busy: boolean;
  /** Pathname being navigated to, when there is one. */
  to?: string;
}

export function useActivity(): Activity;

/** True once `active` has held for `delay` ms. Turns off immediately. */
export function useDelayed(active: boolean, delay: number): boolean;

export interface PendingProps {
  children: ReactNode | ((activity: Activity) => ReactNode);
  /** Which work to react to. Defaults to `any`. */
  when?: 'any' | 'navigation' | 'submission';
  /** Suppress until the work has been in flight this long, in ms. */
  delay?: number;
  fallback?: ReactNode;
}

export function Pending(props: PendingProps): ReactNode;

export interface NavigationProgressProps {
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode | ((activity: Activity) => ReactNode);
  delay?: number;
}

/** A `data-ness-progress` container shown while the router is busy. */
export function NavigationProgress(props: NavigationProgressProps): ReactNode;

/* Forms -------------------------------------------------------------------- */

export interface FormState<Data = unknown> {
  pending: boolean;
  data?: Data;
  error?: unknown;
  state: 'idle' | 'loading' | 'submitting';
}

export type FormProps<Data = unknown> = Omit<
  ComponentProps<typeof RouterForm>,
  'children'
> & {
  children: ReactNode | ((state: FormState<Data>) => ReactNode);
  /** Reset the fields when the action returns without an error. */
  resetOnSuccess?: boolean;
};

export function Form<Data = unknown>(props: FormProps<Data>): ReactNode;

/* URL state ---------------------------------------------------------------- */

export interface SearchParamOptions {
  defaultValue?: string;
  /** Replace the history entry instead of pushing. Defaults to true. */
  replace?: boolean;
}

/** Reads and writes one search parameter; clearing removes it from the URL. */
export function useSearchParam(
  name: string,
  options?: SearchParamOptions,
): [string, (value: string | number | undefined) => void];

export type SearchFieldProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'name'
> & {
  name?: string;
  /** Quiet period before the URL is updated, in ms. Defaults to 300. */
  delay?: number;
  onSearch?: (value: string) => void;
  defaultValue?: string;
};

/** A debounced input bound to a search parameter. */
export function SearchField(props: SearchFieldProps): ReactNode;

export interface PaginationState {
  page: number;
  pageCount: number;
  /** Page numbers around the current one, for rendering links. */
  pages: number[];
  hrefFor(page: number): string;
  hasPrevious: boolean;
  hasNext: boolean;
  previousHref?: string;
  nextHref?: string;
  /** Rows to skip for the current page. */
  offset: number;
}

export interface PaginationProps {
  total: number;
  pageSize?: number;
  name?: string;
  /** Page numbers to show either side of the current one. */
  siblings?: number;
  children: (state: PaginationState) => ReactNode;
}

export function Pagination(props: PaginationProps): ReactNode;

/** Submits the containing form on change, for filter panels with no button. */
export function useSubmitOnChange(options?: {
  replace?: boolean;
}): (event: { currentTarget: HTMLFormElement }) => void;
