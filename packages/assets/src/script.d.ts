import type { ScriptHTMLAttributes } from 'react';
import type * as React from 'react';
export interface ScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
}
export function Script(props: ScriptProps): React.ReactElement | null;
