import { createElement, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useNavigation } from 'react-router';

export interface Activity {
  state: 'idle' | 'loading' | 'submitting';
  idle: boolean;
  navigating: boolean;
  submitting: boolean;
  busy: boolean;
  /** Pathname being navigated to, when there is one. */
  to?: string | undefined;
}

export interface PendingProps {
  children: ReactNode | ((activity: Activity) => ReactNode);
  /** Which work to react to. Defaults to `any`. */
  when?: 'any' | 'navigation' | 'submission';
  /** Suppress until the work has been in flight this long, in ms. */
  delay?: number;
  fallback?: ReactNode;
}

export interface NavigationProgressProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode | ((activity: Activity) => ReactNode);
  delay?: number;
}

/**
 * What the router is currently doing, normalized to the three questions a UI
 * actually asks: is anything in flight, is it a navigation, is it a submission.
 */
function useActivity(): Activity {
  const navigation = useNavigation();
  return {
    state: navigation.state,
    idle: navigation.state === 'idle',
    navigating: navigation.state === 'loading',
    submitting: navigation.state === 'submitting',
    busy: navigation.state !== 'idle',
    to: navigation.location?.pathname,
  };
}

/**
 * True once `active` has held for `delay` milliseconds, and false immediately
 * when it stops.
 *
 * A spinner that appears for 80 ms and vanishes reads as a glitch, so pending
 * UI is usually worse than none unless it waits. Turning off is not delayed:
 * once the work is done, hiding it late is its own flicker.
 */
function useDelayed(active: boolean, delay: number): boolean {
  const [shown, setShown] = useState(active && delay <= 0);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return undefined;
    }
    if (delay <= 0) {
      setShown(true);
      return undefined;
    }
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  return shown;
}

const MATCHES: Record<
  NonNullable<PendingProps['when']>,
  (activity: Activity) => boolean
> = {
  any: activity => activity.busy,
  navigation: activity => activity.navigating,
  submission: activity => activity.submitting,
};

/**
 * Renders `children` only while the router is busy.
 *
 * `when` narrows it to `'navigation'`, `'submission'`, or `'any'` (the
 * default). `delay` suppresses the render until the work has been in flight
 * that long, so a fast response produces no spinner at all.
 *
 * `children` may be a render prop, which receives the activity.
 */
function Pending({
  children,
  when = 'any',
  delay = 0,
  fallback = null,
}: PendingProps): ReactNode {
  const activity = useActivity();
  const active = (MATCHES[when] || MATCHES.any)(activity);
  const shown = useDelayed(active, delay);

  if (!shown) return fallback;
  return typeof children === 'function' ? children(activity) : children;
}

/**
 * A progress element driven by navigation state.
 *
 * Renders nothing while idle, and while busy renders a container carrying
 * `data-ness-progress` with the current state. Styling is the application's:
 * this package ships no CSS.
 */
function NavigationProgress({
  className,
  style,
  children,
  delay = 0,
}: NavigationProgressProps): ReactNode {
  const activity = useActivity();
  const shown = useDelayed(activity.busy, delay);
  if (!shown) return null;

  return createElement(
    'div',
    {
      role: 'progressbar',
      'aria-busy': 'true',
      'aria-label': 'Loading',
      'data-ness-progress': activity.state,
      className,
      style,
    },
    typeof children === 'function' ? children(activity) : children,
  );
}

export { NavigationProgress, Pending, useActivity, useDelayed };
