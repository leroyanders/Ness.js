import React from 'react';

function loadScript({
  src,
  id,
  integrity,
  crossOrigin,
  nonce,
  onLoad,
  onError,
}) {
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

function Script({
  strategy = 'afterInteractive',
  children,
  dangerouslySetInnerHTML,
  onLoad,
  onError,
  ...props
}) {
  React.useEffect(() => {
    if (strategy === 'beforeInteractive' || typeof document === 'undefined')
      return undefined;
    const run = () => loadScript({ ...props, onLoad, onError });
    if (strategy === 'lazyOnload') {
      const listener = () =>
        'requestIdleCallback' in window
          ? window.requestIdleCallback(run)
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
