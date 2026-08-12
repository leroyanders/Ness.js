import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';

function postcssPlugins(production) {
  return [
    tailwindcss(),
    ...(production ? [cssnano({ preset: 'default' })] : []),
  ];
}

function tailwind(options = {}) {
  return {
    name: 'ness:tailwind',
    enforce: 'pre',
    // Two hooks, deliberately not one:
    // - `config` is what the classic dev server (`ness dev`) consults for
    //   its single shared CSS pipeline.
    // - `configEnvironment` is what the per-environment build
    //   (`ness build`, Vite's Environment API — client and ssr resolved
    //   independently) uses instead.
    // See https://vite.dev/guide/api-plugin.html#configenvironment —
    // neither hook subsumes the other, so both stay.
    //
    // `ssr.noExternal` for 'tailwindcss' is load-bearing, not decoration:
    // `app.css`'s `@import 'tailwindcss'` makes Vite's CSS pipeline
    // auto-insert its own postcss-import ahead of whatever's in
    // `css.postcss.plugins` (triggered by the raw source containing
    // "@import", independent of any plugin config). That auto-inserted
    // resolver asks the environment to resolve the bare specifier
    // `tailwindcss` — and the ssr environment, left to its default
    // dependency-externalization policy, hands back the bare specifier
    // itself (correct for a JS `import`, meaningless for a CSS `@import`:
    // there's no runtime resolution step for CSS). postcss-import then
    // treats that string as a path and reads it relative to `cwd`, which
    // doesn't exist, hence ENOENT. `noExternal` forces the ssr environment
    // to resolve `tailwindcss` to a real file up front — the same
    // resolution the client environment already does by default — so the
    // `style`-condition export (`tailwindcss/index.css`) comes back
    // instead of the bare name.
    config(_config, env) {
      const production = options.minify ?? env.command === 'build';
      return {
        css: {
          postcss: {
            plugins: postcssPlugins(production),
          },
        },
        ssr: {
          noExternal: ['tailwindcss'],
        },
      };
    },
    configEnvironment(_name, _config, env) {
      const production = options.minify ?? env.command === 'build';
      return {
        css: {
          postcss: {
            plugins: postcssPlugins(production),
          },
        },
        ...(_name === 'ssr'
          ? { resolve: { noExternal: ['tailwindcss'] } }
          : {}),
      };
    },
  };
}

export { tailwind };
export default tailwind;
