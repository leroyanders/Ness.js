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
    config(_config, environment) {
      const production = options.minify ?? environment.command === 'build';
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
