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

function compression(options = {}) {
  return {
    name: 'ness:compression',
    apply: 'build',
    generateBundle(_outputOptions, bundle) {
      for (const [filename, output] of Object.entries(bundle)) {
        const source = output.type === 'chunk' ? output.code : output.source;
        for (const compressed of compressAsset(filename, source, options)) {
          this.emitFile({
            type: 'asset',
            fileName: compressed.filename,
            source: compressed.source,
          });
        }
      }
    },
  };
}

class NessWebpackCompressionPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const pluginName = 'NessCompression';
    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      const stage =
        compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER;
      compilation.hooks.processAssets.tap({ name: pluginName, stage }, () => {
        for (const asset of compilation.getAssets()) {
          for (const compressed of compressAsset(
            asset.name,
            asset.source.source(),
            this.options,
          )) {
            compilation.emitAsset(
              compressed.filename,
              new compiler.webpack.sources.RawSource(compressed.source),
            );
          }
        }
      });
    });
  }
}

function install(config, options = {}) {
  if (options.dev) return config;
  config.plugins = [
    ...(config.plugins || []),
    new NessWebpackCompressionPlugin(options),
  ];
  return config;
}

export { compressAsset, compression, install };
export default compression;
