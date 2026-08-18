import sharp from 'sharp';
import type { ReactElement } from 'react';

/** A face satori can lay text out with. Structural, so satori stays optional. */
export interface ImageResponseFont {
  name: string;
  data: ArrayBuffer | Buffer;
  weight?: number;
  style?: 'normal' | 'italic';
  lang?: string;
}

export type ImageResponseFormat = 'png' | 'jpeg' | 'webp' | 'svg';

export interface ImageResponseOptions extends Omit<ResponseInit, 'headers'> {
  width?: number;
  height?: number;
  fonts?: ImageResponseFont[];
  format?: ImageResponseFormat;
  headers?: HeadersInit;
  debug?: boolean;
  [option: string]: unknown;
}

type SatoriFn = (
  element: unknown,
  options: Record<string, unknown>,
) => Promise<string>;

/**
 * Satori is what turns an element tree into an SVG — a layout engine, not a
 * renderer, and a large dependency for a feature most applications never use.
 * Kept as an optional peer for the same reason `@vitejs/plugin-rsc` is: the
 * projects that want it install it, the rest never pay for it.
 */
function layoutEngine(): Promise<SatoriFn> {
  return import('satori').then(
    module => ((module as { default?: unknown }).default || module) as SatoriFn,
    () => {
      throw new Error(
        'ImageResponse needs satori. Install it with: npm install satori',
      );
    },
  );
}

const DEFAULT_SIZE = { width: 1200, height: 630 };

/**
 * A share card, rendered from an element.
 *
 * ```tsx
 * export async function loader() {
 *   return new ImageResponse(
 *     <div style={{ display: 'flex', background: '#fff', width: '100%', height: '100%' }}>
 *       <h1 style={{ margin: 'auto', fontSize: 64 }}>Hello</h1>
 *     </div>,
 *     { fonts: [{ name: 'Inter', data: await readFile('inter.ttf') }] },
 *   );
 * }
 * ```
 *
 * A `Response` rather than something that becomes one: it is returned from a
 * loader like any other, and the body is produced lazily, so a route that
 * throws before it is read costs nothing.
 *
 * Fonts have no default. Satori cannot lay out text without one, and shipping
 * a face inside the framework would be picking a typeface — and a licence —
 * for every application that ever renders a card.
 */
class ImageResponse extends Response {
  constructor(element: ReactElement, options: ImageResponseOptions = {}) {
    const {
      width = DEFAULT_SIZE.width,
      height = DEFAULT_SIZE.height,
      fonts,
      format = 'png',
      headers,
      status,
      statusText,
      debug,
      ...rest
    } = options;

    const body = new ReadableStream({
      async start(controller) {
        try {
          const satori = await layoutEngine();
          if (!fonts?.length)
            throw new Error(
              'ImageResponse needs at least one font: pass { fonts: [{ name, data }] }.',
            );
          const svg = await satori(element, {
            width,
            height,
            fonts,
            debug,
            ...rest,
          });
          const image =
            format === 'svg'
              ? Buffer.from(svg)
              : // The encoder is chosen by name; sharp declares one method per
                // format rather than a single parameterised one.
                await (
                  sharp(Buffer.from(svg)) as unknown as Record<
                    string,
                    () => { toBuffer(): Promise<Buffer> }
                  >
                )[format]!().toBuffer();
          controller.enqueue(new Uint8Array(image));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const responseHeaders = new Headers(headers);
    if (!responseHeaders.has('content-type')) {
      responseHeaders.set(
        'content-type',
        format === 'svg' ? 'image/svg+xml' : `image/${format}`,
      );
    }
    if (!responseHeaders.has('cache-control')) {
      // What a share card is: the same bytes for everyone, for a long time.
      responseHeaders.set(
        'cache-control',
        process.env['NODE_ENV'] === 'development'
          ? 'no-store'
          : 'public, immutable, no-transform, max-age=31536000',
      );
    }
    super(body, { status, statusText, headers: responseHeaders });
  }
}

export { ImageResponse };
