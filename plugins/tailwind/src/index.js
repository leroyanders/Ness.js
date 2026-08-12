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
    //   independently) uses instead. Without it, an SSR entry that
    //   imports the stylesheet (e.g. a root layout) fails PostCSS with
    //   `@import 'tailwindcss'` unresolved, since the ssr environment
    //   never received the `@tailwindcss/postcss` plugin.
    // See https://vite.dev/guide/api-plugin.html#configenvironment —
    // neither hook subsumes the other, so both stay.
    config(_config, env) {
      const production = options.minify ?? env.command === 'build';
      return {
        css: {
          postcss: {
            plugins: postcssPlugins(production),
          },
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
      };
    },
  };
}

export { tailwind };
export default tailwind;
