/**
 * Renders every logo and icon in the repository from one source:
 * docs/static/img/logo.svg. Edit that, then run this rather than hand-editing
 * anything downstream.
 *
 *   node scripts/assets/logo.mjs
 *   node scripts/assets/logo.mjs --check     exit 1 if anything is stale
 *
 * There is no second drawing for app icons. The mark carries its own disc, so
 * it is already its own plate — one file serves the header, the tab, the readme
 * and the starter pages. Only the corners outside the disc are transparent.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

const MARK = 'docs/static/img/logo.svg';

/** The disc, for the one icon whose corners have to be filled. */
const DISC = '#000000';

/** Where the mark is copied verbatim. */
const MARK_COPIES = [
  'templates/default/template/public/assets/logo.svg',
  'templates/typescript/template/public/assets/logo.svg',
  'examples/welcome/public/assets/logo.svg',
];

/** PNGs with the corners left transparent, at the size each consumer asks for. */
const PNGS = [
  ['docs/static/img/favicon-16x16.png', 16],
  ['docs/static/img/favicon-32x32.png', 32],
  ['docs/static/img/favicon.png', 512],
  ['docs/static/img/android-chrome-192x192.png', 192],
  ['docs/static/img/android-chrome-512x512.png', 512],
];

/**
 * iOS composites a transparent touch icon onto black of its own accord, which
 * would be right by accident here. The corners are filled explicitly instead,
 * so the icon is the same on every platform rather than the same by luck.
 */
const FLATTENED_PNGS = [['docs/static/img/apple-touch-icon.png', 180]];

/** Everywhere a favicon.ico is served. */
const ICOS = [
  'docs/static/img/favicon.ico',
  'templates/default/template/public/favicon.ico',
  'templates/typescript/template/public/favicon.ico',
  'examples/welcome/public/favicon.ico',
];

/** The sizes packed into each .ico. 48 is what Windows uses for the taskbar. */
const ICO_SIZES = [16, 32, 48];

/**
 * `density` drives librsvg's rasterisation, not the output size. Left at the
 * default 72 the source is rendered into a 512px buffer and then resampled,
 * which frays the sheared terminals; 900 renders large enough that every output
 * size downsamples from a supersampled original.
 */
const DENSITY = 900;

function render(svg, size, { flatten = false } = {}) {
  const pipeline = sharp(svg, { density: DENSITY }).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  return (flatten ? pipeline.flatten({ background: DISC }) : pipeline)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * An .ico is a 6-byte header, one 16-byte directory entry per image, then the
 * payloads. Every entry here is a PNG, which every browser in the support range
 * reads and which keeps the file a fraction of the size of packed bitmaps.
 */
function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach(({ size, data }, index) => {
    const entry = 16 * index;
    // 256 is written as 0; the field is a single byte.
    directory.writeUInt8(size >= 256 ? 0 : size, entry);
    directory.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    directory.writeUInt8(0, entry + 2); // palette size: 0 for truecolour
    directory.writeUInt8(0, entry + 3); // reserved
    directory.writeUInt16LE(1, entry + 4); // colour planes
    directory.writeUInt16LE(32, entry + 6); // bits per pixel
    directory.writeUInt32LE(data.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...images.map(image => image.data)]);
}

const digest = buffer => createHash('sha256').update(buffer).digest('hex');

async function currentBytes(file) {
  try {
    return await readFile(path.join(root, file));
  } catch {
    return null;
  }
}

async function main() {
  const check = process.argv.includes('--check');
  const mark = await readFile(path.join(root, MARK));

  const outputs = [];

  for (const file of MARK_COPIES) outputs.push([file, mark]);
  for (const [file, size] of PNGS)
    outputs.push([file, await render(mark, size)]);
  for (const [file, size] of FLATTENED_PNGS)
    outputs.push([file, await render(mark, size, { flatten: true })]);

  const icoImages = await Promise.all(
    ICO_SIZES.map(async size => ({ size, data: await render(mark, size) })),
  );
  const ico = encodeIco(icoImages);
  for (const file of ICOS) outputs.push([file, ico]);

  const stale = [];

  for (const [file, bytes] of outputs) {
    const existing = await currentBytes(file);
    if (existing && digest(existing) === digest(bytes)) continue;
    stale.push(file);
    if (check) continue;
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), bytes);
  }

  if (check) {
    if (stale.length) {
      console.error(
        `${stale.length} asset(s) do not match the sources:\n  ${stale.join('\n  ')}\n` +
          'Run: node scripts/assets/logo.mjs',
      );
      process.exit(1);
    }
    console.log(`${outputs.length} assets match ${MARK}.`);
    return;
  }

  console.log(
    stale.length
      ? `Wrote ${stale.length} of ${outputs.length} assets:\n  ${stale.join('\n  ')}`
      : `All ${outputs.length} assets were already up to date.`,
  );
}

await main();
