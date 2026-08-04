import fs from 'node:fs';
import path from 'node:path';

const STACK_FRAME = /^\s*at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?\s*$/;
const CONTEXT_LINES = 4;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stripFileUrl(file) {
  return file.startsWith('file://') ? file.slice('file://'.length) : file;
}

/**
 * Splits a V8 stack into frames. Vite's `ssrFixStacktrace` has already
 * rewritten the transformed positions back to source ones by the time this
 * runs, so the locations point at the file the developer wrote.
 */
function parseStack(stack = '') {
  return stack
    .split('\n')
    .slice(1)
    .map(line => {
      const match = STACK_FRAME.exec(line);
      if (!match) return undefined;
      const [, name, file, lineNumber, column] = match;
      return {
        name: name || '<anonymous>',
        file: stripFileUrl(file),
        line: Number(lineNumber),
        column: Number(column),
      };
    })
    .filter(Boolean);
}

function isProjectFrame(frame, root) {
  if (!frame.file.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(frame.file)) {
    return false;
  }
  if (frame.file.includes('node_modules')) return false;
  const relative = path.relative(root, frame.file);
  return Boolean(relative) && !relative.startsWith('..');
}

/**
 * Reads the lines around a failing location. Restricted to files inside the
 * project root so a frame pointing outside it cannot be used to read arbitrary
 * files through the dev server.
 */
function readCodeFrame(frame, root) {
  if (!frame || !isProjectFrame(frame, root)) return undefined;
  let source;
  try {
    source = fs.readFileSync(frame.file, 'utf8');
  } catch {
    return undefined;
  }
  const lines = source.split('\n');
  const start = Math.max(0, frame.line - 1 - CONTEXT_LINES);
  const end = Math.min(lines.length, frame.line + CONTEXT_LINES);
  return {
    start: start + 1,
    lines: lines.slice(start, end),
    highlight: frame.line,
    column: frame.column,
  };
}

function renderCodeFrame(codeFrame) {
  if (!codeFrame) return '';
  const rows = codeFrame.lines
    .map((line, index) => {
      const number = codeFrame.start + index;
      const active = number === codeFrame.highlight;
      const marker = active
        ? `<div class="caret">${' '.repeat(Math.max(0, codeFrame.column - 1))}^</div>`
        : '';
      return `<div class="line${active ? ' active' : ''}"><span class="ln">${number}</span><span class="code">${escapeHtml(line)}</span></div>${marker}`;
    })
    .join('');
  return `<pre class="frame">${rows}</pre>`;
}

function renderFrames(frames, root) {
  if (!frames.length) return '';
  return `<ol class="stack">${frames
    .map(frame => {
      const project = isProjectFrame(frame, root);
      const label = project ? path.relative(root, frame.file) : frame.file;
      const location = `${escapeHtml(label)}:${frame.line}:${frame.column}`;
      const href = `/__open-in-editor?file=${encodeURIComponent(`${frame.file}:${frame.line}:${frame.column}`)}`;
      return `<li class="${project ? 'own' : 'vendor'}"><span class="fn">${escapeHtml(frame.name)}</span>${
        project
          ? `<a class="loc" href="${href}">${location}</a>`
          : `<span class="loc">${location}</span>`
      }</li>`;
    })
    .join('')}</ol>`;
}

const STYLES = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0d12;color:#e6e8ee;font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}
main{max-width:1000px;margin:0 auto;padding:48px 24px}
.badge{display:inline-block;background:#e5484d;color:#fff;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
h1{margin:16px 0 4px;font-size:22px;font-weight:600;color:#ff9ea1;word-break:break-word}
.request{color:#7c8496;margin:0 0 28px;font-size:13px}
section{margin-bottom:28px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#7c8496;margin:0 0 10px}
.frame{background:#12151c;border:1px solid #232838;border-radius:10px;padding:14px 0;overflow-x:auto;margin:0}
.line{display:flex;padding:0 16px;white-space:pre}
.line.active{background:#2a1416}
.ln{width:48px;flex:none;color:#5b6274;text-align:right;padding-right:16px;user-select:none}
.caret{padding-left:80px;color:#e5484d;white-space:pre}
.stack{list-style:none;margin:0;padding:0;border:1px solid #232838;border-radius:10px;overflow:hidden}
.stack li{display:flex;gap:14px;padding:8px 16px;border-top:1px solid #1a1f2b}
.stack li:first-child{border-top:0}
.stack li.vendor{opacity:.45}
.fn{flex:1;color:#c8cede;word-break:break-all}
.loc{color:#7c8496;text-decoration:none;white-space:nowrap}
a.loc{color:#6aa5ff}
a.loc:hover{text-decoration:underline}
footer{color:#5b6274;font-size:12px;border-top:1px solid #1a1f2b;padding-top:16px}
`;

function renderOverlay(error, request, root) {
  const frames = parseStack(error.stack);
  const codeFrame = readCodeFrame(
    frames.find(frame => isProjectFrame(frame, root)),
    root,
  );
  const name = error.name || 'Error';
  const method = request?.method || 'GET';
  const url = request?.url || '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(name)}: ${escapeHtml(error.message)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
  <span class="badge">Server error</span>
  <h1>${escapeHtml(name)}: ${escapeHtml(error.message)}</h1>
  <p class="request">${escapeHtml(method)} ${escapeHtml(url)}</p>
  ${codeFrame ? `<section><h2>Source</h2>${renderCodeFrame(codeFrame)}</section>` : ''}
  ${frames.length ? `<section><h2>Stack</h2>${renderFrames(frames, root)}</section>` : ''}
  <footer>This page is shown by the Ness.js development server and never in production. Fix the error above and the page reloads.</footer>
</main>
<script type="module">
  import.meta.hot?.on?.('vite:beforeUpdate', () => location.reload());
</script>
</body>
</html>`;
}

/** Vite 6+ exposes the client channel per environment; Vite 5 used server.ws. */
function sendToClient(server, payload) {
  const channel = server.environments?.client?.hot || server.hot || server.ws;
  channel?.send?.(payload);
}

/**
 * Pushes an error into Vite's own overlay. Used for errors the application
 * already handled (an ErrorBoundary rendered), where the page looks fine but
 * the developer still needs to see what went wrong.
 */
function reportServerError(server, error) {
  if (!server || !error) return;
  server.ssrFixStacktrace?.(error);
  const [frame] = parseStack(error.stack);
  sendToClient(server, {
    type: 'error',
    err: {
      message: error.message,
      stack: error.stack || '',
      id: frame?.file,
      loc: frame
        ? { file: frame.file, line: frame.line, column: frame.column }
        : undefined,
      plugin: 'ness:error-overlay',
    },
  });
}

/**
 * Renders unhandled server errors as a readable page with source-mapped
 * frames, a code frame, and editor links, instead of the framework's default
 * "Internal Server Error" body.
 *
 * Only active in `ness dev`; the plugin is not applied to builds.
 */
function nessErrorOverlay(options = {}) {
  return {
    name: 'ness:error-overlay',
    apply: 'serve',
    configureServer(server) {
      // Returning a function defers registration until after Vite's own
      // middlewares, so this handler sees errors none of them handled.
      return () => {
        server.middlewares.use((error, request, response, next) => {
          if (!error) return next();
          try {
            server.ssrFixStacktrace?.(error);
            options.onError?.(error, request);
            reportServerError(server, error);

            if (
              response.headersSent ||
              !String(request.headers.accept || '').includes('text/html')
            ) {
              return next(error);
            }

            response.statusCode = 500;
            response.setHeader('content-type', 'text/html; charset=utf-8');
            response.setHeader('cache-control', 'no-store');
            response.end(renderOverlay(error, request, server.config.root));
          } catch {
            next(error);
          }
        });
      };
    },
  };
}

export {
  isProjectFrame,
  nessErrorOverlay,
  parseStack,
  renderOverlay,
  reportServerError,
};
export default nessErrorOverlay;
