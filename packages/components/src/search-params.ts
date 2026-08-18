import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ComponentProps, ReactNode } from 'react';
import { useSearchParams, useSubmit } from 'react-router';

export interface SearchParamOptions {
  defaultValue?: string;
  /** Replace the history entry instead of pushing. Defaults to true. */
  replace?: boolean;
}

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

export interface PaginationState {
  page: number;
  pageCount: number;
  /** Page numbers around the current one, for rendering links. */
  pages: number[];
  hrefFor(page: number): string;
  hasPrevious: boolean;
  hasNext: boolean;
  previousHref?: string | undefined;
  nextHref?: string | undefined;
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

/**
 * Reads and writes a single search parameter.
 *
 * The URL is the state: a filter, a query, or a page number belongs there so
 * the view is linkable, restorable with the back button, and re-fetched by the
 * loader that already reads `request.url`. Setting a value to its default or
 * to an empty string removes the parameter rather than leaving `?q=` behind.
 */
function useSearchParam(
  name: string,
  { defaultValue = '', replace = true }: SearchParamOptions = {},
): [string, (value: string | number | undefined) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? defaultValue;

  const setValue = useCallback(
    (next: string | number | undefined) => {
      setParams(
        current => {
          const updated = new URLSearchParams(current);
          if (next === '' || next === undefined || next === defaultValue) {
            updated.delete(name);
          } else {
            updated.set(name, String(next));
          }
          return updated;
        },
        { replace, preventScrollReset: true },
      );
    },
    [defaultValue, name, replace, setParams],
  );

  return [value, setValue];
}

/**
 * A search input bound to a search parameter, debounced.
 *
 * Every keystroke would otherwise be a navigation and a loader call. The input
 * stays responsive because it holds its own value; the URL catches up after
 * `delay` milliseconds of quiet.
 *
 * Renders a bare `<input>` with no styles — pass `className` or any input prop.
 * Without JavaScript it still works: it is a real input inside whatever form
 * wraps it.
 */
function SearchField({
  name = 'q',
  delay = 300,
  onSearch,
  defaultValue = '',
  ...props
}: SearchFieldProps): ReactNode {
  const [committed, setCommitted] = useSearchParam(name, { defaultValue });
  const [draft, setDraft] = useState(committed);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A change that did not come from typing — a back navigation, a cleared
  // filter — has to be reflected in the field.
  useEffect(() => {
    setDraft(current => (current === committed ? current : committed));
  }, [committed]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCommitted(next);
      onSearch?.(next);
    }, delay);
  };

  return createElement('input', {
    ...props,
    type: props.type || 'search',
    name,
    value: draft,
    onChange: change,
    'data-ness-search': name,
  });
}

/**
 * Page numbers and hrefs for a result set, driven by a search parameter.
 *
 * `children` is a render prop so the markup stays the application's. Pages are
 * one-based, hrefs preserve every other parameter, and the first page omits
 * the parameter entirely so `/products` and `/products?page=1` are one URL
 * rather than two that a crawler treats as duplicates.
 */
function Pagination({
  total,
  pageSize = 20,
  name = 'page',
  siblings = 1,
  children,
}: PaginationProps): ReactNode {
  const [params] = useSearchParams();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const requested = Number.parseInt(params.get(name) ?? '1', 10);
  const page = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), pageCount)
    : 1;

  const hrefFor = (target: number): string => {
    const updated = new URLSearchParams(params);
    if (target <= 1) updated.delete(name);
    else updated.set(name, String(target));
    const query = updated.toString();
    return query ? `?${query}` : '?';
  };

  const from = Math.max(1, page - siblings);
  const to = Math.min(pageCount, page + siblings);
  const pages: number[] = [];
  for (let index = from; index <= to; index += 1) pages.push(index);

  return children({
    page,
    pageCount,
    pages,
    hrefFor,
    hasPrevious: page > 1,
    hasNext: page < pageCount,
    previousHref: page > 1 ? hrefFor(page - 1) : undefined,
    nextHref: page < pageCount ? hrefFor(page + 1) : undefined,
    offset: (page - 1) * pageSize,
  });
}

/**
 * Submits the containing form whenever a control changes, so a filter panel
 * needs no submit button while remaining a real form without JavaScript.
 */
function useSubmitOnChange({ replace = true }: { replace?: boolean } = {}) {
  const submit = useSubmit();
  return useCallback(
    (event: { currentTarget: HTMLFormElement }) =>
      submit(event.currentTarget, { replace, preventScrollReset: true }),
    [replace, submit],
  );
}

export { Pagination, SearchField, useSearchParam, useSubmitOnChange };
