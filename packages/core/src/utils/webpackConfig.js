import path from 'node:path';

class WebpackConfig {
  constructor(cwd) {
    this.cwd = cwd;
  }

  getRules(config) {
    return [
      ...(config.module.loaders || []),
      ...(config.module.rules || []),
    ].map((rule, index) => ({
      index,
      rule,
    }));
  }

  getLoaders(config) {
    return this.getRules(config).map(({ rule, index }) => ({
      rule,
      ruleIndex: index,
      loaders: rule.loaders || rule.use || rule.loader,
    }));
  }

  getPlugins(config) {
    return (config.plugins || []).map((plugin, index) => ({ index, plugin }));
  }

  getRulesByMatchingFile(config, file) {
    const filePath = path.resolve(this.cwd, file);
    return this.getRules(config).filter(({ rule }) => {
      if (!rule.test) return false;
      rule.test.lastIndex = 0;
      return rule.test.test(filePath);
    });
  }

  getLoadersByName(config, name) {
    return this.getLoaders(config)
      .flatMap(({ rule, ruleIndex, loaders }) =>
        (Array.isArray(loaders) ? loaders : [loaders]).map(
          (loader, loaderIndex) => ({
            rule,
            ruleIndex,
            loader,
            loaderIndex: Array.isArray(loaders) ? loaderIndex : -1,
          }),
        ),
      )
      .filter(
        ({ loader }) => loader === name || (loader && loader.loader === name),
      );
  }

  getPluginsByName(config, name) {
    return this.getPlugins(config).filter(
      ({ plugin }) =>
        plugin && plugin.constructor && plugin.constructor.name === name,
    );
  }

  getPluginsByType(config, type) {
    return this.getPlugins(config).filter(
      ({ plugin }) => plugin instanceof type,
    );
  }

  getResolveExtensions(config) {
    return config.resolve.extensions;
  }

  addResolveExtensions(config, extensions) {
    return [...config.resolve.extensions, ...extensions];
  }

  makeLoaderFinder(loaderName) {
    return rule => {
      const loaders = [
        rule.loader,
        ...(Array.isArray(rule.use) ? rule.use : []),
      ].filter(Boolean);
      return loaders.some(loader => {
        const name = typeof loader === 'string' ? loader : loader.loader;
        return typeof name === 'string' && name.includes(loaderName);
      });
    };
  }
}

export default WebpackConfig;
