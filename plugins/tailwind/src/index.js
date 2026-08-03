import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';

function isPostCssLoader(loader) {
  const name = typeof loader === 'string' ? loader : loader && loader.loader;
  return typeof name === 'string' && name.includes('postcss-loader');
}

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

function install(config, options = {}) {
  if (options.target !== 'web') return config;

  for (const rule of config.module.rules) {
    if (!Array.isArray(rule.use)) continue;

    const loader = rule.use.find(isPostCssLoader);
    if (!loader || typeof loader === 'string') continue;

    loader.options = {
      ...loader.options,
      postcssOptions: {
        ...loader.options?.postcssOptions,
        plugins: postcssPlugins(!options.dev),
      },
    };
  }

  return config;
}

export { install, tailwind };
export default { install, vite: tailwind };
