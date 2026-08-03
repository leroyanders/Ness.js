import fs from 'node:fs';
import path from 'node:path';

function byteLength(source) {
  if (source == null) return 0;
  if (typeof source === 'string') return Buffer.byteLength(source);
  return source.byteLength ?? source.length ?? 0;
}

function bundleEntries(bundle) {
  return Object.entries(bundle)
    .map(([file, output]) => ({
      file,
      type: output.type,
      size: byteLength(output.type === 'chunk' ? output.code : output.source),
      ...(output.type === 'chunk'
        ? {
            imports: output.imports || [],
            dynamicImports: output.dynamicImports || [],
            modules: Object.keys(output.modules || {}),
          }
        : {}),
    }))
    .sort((left, right) => right.size - left.size);
}

function createReport(entries) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalSize: entries.reduce((total, entry) => total + entry.size, 0),
    files: entries,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function reportHtml(report) {
  const rows = report.files
    .map(
      file =>
        `<tr><td>${escapeHtml(file.file)}</td><td>${escapeHtml(file.type)}</td><td>${file.size.toLocaleString()} B</td></tr>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Ness bundle report</title><style>body{font:14px ui-monospace,monospace;margin:40px;color:#18181b}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}</style></head><body><h1>Ness bundle report</h1><p>Total: ${report.totalSize.toLocaleString()} bytes</p><table><thead><tr><th>File</th><th>Type</th><th>Size</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function assertBudget(context, report, maxSize) {
  if (maxSize && report.totalSize > maxSize) {
    context.error(
      `Ness bundle size ${report.totalSize} bytes exceeds the ${maxSize} byte budget.`,
    );
  }
}

function analyzer(options = {}) {
  const reportFile = options.reportFile || 'ness-bundle-report.json';
  return {
    name: 'ness:analyzer',
    apply: 'build',
    generateBundle(_outputOptions, bundle) {
      const report = createReport(bundleEntries(bundle));
      assertBudget(this, report, options.maxSize);
      this.emitFile({
        type: 'asset',
        fileName: reportFile,
        source: `${JSON.stringify(report, null, 2)}\n`,
      });
      if (options.html !== false) {
        this.emitFile({
          type: 'asset',
          fileName: options.htmlFile || 'ness-bundle-report.html',
          source: reportHtml(report),
        });
      }
    },
  };
}

class NessWebpackAnalyzerPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.done.tap('NessBundleAnalyzer', stats => {
      const data = stats.toJson({ all: false, assets: true });
      const entries = (data.assets || [])
        .map(asset => ({
          file: asset.name,
          type: 'asset',
          size: Number(asset.size) || 0,
        }))
        .sort((left, right) => right.size - left.size);
      const report = createReport(entries);
      if (this.options.maxSize && report.totalSize > this.options.maxSize) {
        throw new Error(
          `Ness bundle size ${report.totalSize} bytes exceeds the ${this.options.maxSize} byte budget.`,
        );
      }
      const outputDirectory = compiler.options.output?.path || process.cwd();
      fs.mkdirSync(outputDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(
          outputDirectory,
          this.options.reportFile || 'ness-bundle-report.json',
        ),
        `${JSON.stringify(report, null, 2)}\n`,
      );
    });
  }
}

function install(config, options = {}) {
  config.plugins = [
    ...(config.plugins || []),
    new NessWebpackAnalyzerPlugin(options),
  ];
  return config;
}

export { analyzer, bundleEntries, createReport, install };
export default analyzer;
