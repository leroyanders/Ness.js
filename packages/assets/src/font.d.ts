import type * as React from 'react';

export interface FontSource {
  src: string;
  format?: string;
  type?: string;
  weight?: string;
  style?: string;
}
export interface FontDefinition {
  className: string;
  css: string;
  family: string;
  links: Array<Record<string, string>>;
  style: { fontFamily: string };
  variable?: string;
}
export function localFont(options: {
  src: string | FontSource | Array<string | FontSource>;
  family?: string;
  weight?: string;
  style?: string;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  variable?: string;
  preload?: boolean;
  fallback?: string[];
}): FontDefinition;
export function FontStyles(props: {
  fonts: FontDefinition | FontDefinition[];
}): React.ReactElement;
