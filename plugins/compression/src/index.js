import fs from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const DEFAULT_TEST = /\.(?:css|html|js|json|svg|txt|xml)$/i;

function sourceBuffer(source) {
  if (Buffer.isBuffer(source)) return source;
  if (typeof source === 'string') return Buffer.from(source);
  if (source instanceof Uint8Array) return Buffer.from(source);
  return Buffer.from(String(source ?? ''));
}

function matches(test, filename) {
  if (typeof test === 'function') return test(filename);
  test.lastIndex = 0;
  return test.test(filename);
}

function compressAsset(filename, source, options = {}) {
  const input = sourceBuffer(source);
  const threshold = options.threshold ?? 1_024;
  if (
    input.length < threshold ||
    !matches(options.test || DEFAULT_TEST, filename)
  ) {
    return [];
  }

  const algorithms = options.algorithms || ['gzip', 'brotli'];
  return algorithms
    .map(algorithm => {
      const compressed =
        algorithm === 'brotli'
          ? brotliCompressSync(input, {
              params: {
                [constants.BROTLI_PARAM_QUALITY]: options.brotliQuality ?? 11,
              },
            })
          : gzipSync(input, { level: options.gzipLevel ?? 9 });
      return {
        filename: `${filename}${algorithm === 'brotli' ? '.br' : '.gz'}`,
        source: compressed,
      };
    })
    .filter(output => output.source.length < input.length);
}

/** Every file under `directory`, depth first. */
async function* walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(file);
    else if (entry.isFile()) yield file;
  }
}

/**
 * Writes a `.br` and a `.gz` beside every compressible file in the build.
 *
 * It walks the output directory in `closeBundle` rather than iterating the
 * bundle in `generateBundle`, for two reasons found by checking the result
 * against what the server actually served.
 *
 * The in-memory bundle is not what ships. Vite post-processes chunks on the way
 * to disk, so a twin built from the bundle decodes to something the server
 * never serves — a stylesheet came out carrying a trailing marker the written
 * file did not have. Harmless in itself, but a precompressed asset whose bytes
 * differ from the original is the one thing it must never be.
 *
 * And the bundle is not the whole build. Files copied from `public/`,
 * prerendered HTML, and manifests emitted late are all written to the output
 * directory without ever being bundle entries. In one starter that left
 * `index.html`, the route manifest and an SVG shipping uncompressed.
 */
function compression(options = {}) {
  // Captured per build rather than from `configResolved`. A Ness build runs
  // Vite several times — once to bundle ness.config.mjs itself, then for the
  // client and the server — and `configResolved` reports the config bundle's
  // directory, which is not where the application lands.
  let outputDirectory;

  return {
    name: 'ness:compression',
    apply: 'build',

    writeBundle(outputOptions) {
      outputDirectory = outputOptions.dir;
    },

    // After `writeBundle`, so `public/` has been copied and every other plugin
    // has finished writing.
    async closeBundle() {
      if (!outputDirectory) return;
      try {
        await fs.access(outputDirectory);
      } catch {
        return;
      }

      const written = [];
      for await (const file of walk(outputDirectory)) {
        // Never compress a twin, and never compress twice on a rebuild.
        if (file.endsWith('.br') || file.endsWith('.gz')) continue;
        written.push(file);
      }

      await Promise.all(
        written.map(async file => {
          const source = await fs.readFile(file);
          await Promise.all(
            compressAsset(path.basename(file), source, options).map(
              compressed =>
                fs.writeFile(
                  path.join(
                    path.dirname(file),
                    path.basename(compressed.filename),
                  ),
                  compressed.source,
                ),
            ),
          );
        }),
      );
    },
  };
}

export { compressAsset, compression };
export default compression;
