import type { ImgHTMLAttributes } from 'react';
import type * as React from 'react';
export interface ImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'width' | 'height'
> {
  src:
    | string
    | { src: string; width: number; height: number; blurDataURL?: string };
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  unoptimized?: boolean;
  endpoint?: string;
}
export const DEFAULT_WIDTHS: number[];
export function Image(props: ImageProps): React.ReactElement;
export function imageUrl(
  src: string,
  width: number,
  quality?: number,
  endpoint?: string,
): string;
