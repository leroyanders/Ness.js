import sharp from 'sharp';

/**
 * Satori is what turns an element tree into an SVG — a layout engine, not a
 * renderer, and a large dependency for a feature most applications never use.
 * Kept as an optional peer for the same reason `@vitejs/plugin-rsc` is: the
 * projects that want it install it, the rest never pay for it.
 */
function layoutEngine() {
  return import('satori').then(
    module => module.default || module,
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
  constructor(element, options = {}) {
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
              : await sharp(Buffer.from(svg))[format]().toBuffer();
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
        process.env.NODE_ENV === 'development'
          ? 'no-store'
          : 'public, immutable, no-transform, max-age=31536000',
      );
    }
    super(body, { status, statusText, headers: responseHeaders });
  }
}

export { ImageResponse };
