import React from 'react';
import type { ScriptHTMLAttributes } from 'react';

export interface ScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
}

/** What `loadScript` reads, in DOM terms rather than React's. */
interface LoadScriptOptions {
  src?: string | undefined;
  id?: string | undefined;
  integrity?: string | undefined;
  crossOrigin?: string | undefined;
  nonce?: string | undefined;
  onLoad?: EventListener | undefined;
  onError?: EventListener | undefined;
}

function loadScript({
  src,
  id,
  integrity,
  crossOrigin,
  nonce,
  onLoad,
  onError,
}: LoadScriptOptions): void {
  if (id && document.getElementById(id)) return;
  if (
    src &&
    [...document.scripts].some(
      script => script.src === new URL(src, document.baseURI).href,
    )
  )
    return;
  const element = document.createElement('script');
  if (id) element.id = id;
  if (src) element.src = src;
  if (integrity) element.integrity = integrity;
  if (crossOrigin) element.crossOrigin = crossOrigin;
  if (nonce) element.nonce = nonce;
  element.async = true;
  if (onLoad) element.addEventListener('load', onLoad, { once: true });
  if (onError) element.addEventListener('error', onError, { once: true });
  document.body.appendChild(element);
}

/** `requestIdleCallback` is not in every DOM lib version. */
type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: () => void) => number;
  };

function Script({
  strategy = 'afterInteractive',
  children,
  dangerouslySetInnerHTML,
  onLoad,
  onError,
  ...props
}: ScriptProps): React.ReactElement | null {
  React.useEffect(() => {
    if (strategy === 'beforeInteractive' || typeof document === 'undefined')
      return undefined;
    const run = () =>
      loadScript({
        ...(props as LoadScriptOptions),
        // React's handlers are ordinary functions; the DOM calls them with the
        // event, which is what they already take.
        onLoad: onLoad as unknown as EventListener | undefined,
        onError: onError as unknown as EventListener | undefined,
      });
    if (strategy === 'lazyOnload') {
      const idleWindow = window as IdleWindow;
      const listener = () =>
        'requestIdleCallback' in window
          ? idleWindow.requestIdleCallback!(run)
          : setTimeout(run, 1);
      if (document.readyState === 'complete') listener();
      else window.addEventListener('load', listener, { once: true });
      return () => window.removeEventListener('load', listener);
    }
    run();
    return undefined;
  }, [strategy, props.src, props.id]);

  if (strategy !== 'beforeInteractive') return null;
  return React.createElement('script', {
    ...props,
    dangerouslySetInnerHTML:
      dangerouslySetInnerHTML ||
      (children ? { __html: String(children) } : undefined),
  });
}

export { Script, loadScript };
