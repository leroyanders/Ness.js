'use client';

import React, { Component, Suspense, isValidElement } from 'react';
import type { ReactNode } from 'react';

/**
 * The boundary a parallel-route slot renders inside: the slot's own
 * `loading.tsx` as a Suspense fallback, its own `error.tsx` as an error
 * boundary, so one slot failing or suspending never takes its siblings down.
 *
 * Everything arrives as elements rather than component types: in RSC mode
 * the slot's files are server components, and a rendered element is the only
 * shape of theirs that can cross into this client module.
 */
export interface SlotBoundaryProps {
  children?: ReactNode;
  /** The slot's `loading.tsx`, already rendered. */
  fallback?: ReactNode;
  /** The slot's `error.tsx`, already rendered. */
  errorFallback?: ReactNode;
}

interface SlotErrorBoundaryState {
  error: Error | null;
}

class SlotErrorBoundary extends Component<
  { fallback: ReactNode; children?: ReactNode },
  SlotErrorBoundaryState
> {
  override state: SlotErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SlotErrorBoundaryState {
    return { error };
  }

  override render(): ReactNode {
    if (this.state.error) {
      const { fallback } = this.props;
      // In classic mode the fallback is a live element and can be handed the
      // error; in RSC mode it arrived pre-rendered and shows as it is.
      return isValidElement(fallback)
        ? React.cloneElement(fallback as React.ReactElement<{ error?: Error }>, {
            error: this.state.error,
          })
        : fallback;
    }
    return this.props.children;
  }
}

function SlotBoundary({
  children,
  fallback,
  errorFallback,
}: SlotBoundaryProps): ReactNode {
  let content = children;
  if (fallback !== undefined)
    content = React.createElement(Suspense, { fallback }, content);
  if (errorFallback !== undefined)
    content = React.createElement(
      SlotErrorBoundary,
      { fallback: errorFallback },
      content,
    );
  return content;
}

export { SlotBoundary };
