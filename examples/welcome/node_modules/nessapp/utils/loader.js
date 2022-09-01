var makeLoaderFinder = function makeLoaderFinder(loaderName) {
  return function (rule) {
    var loaderRegex = new RegExp("[/\\\\]".concat(loaderName, "[/\\\\]"));
    var inLoaderString = typeof rule.loader === 'string' && rule.loader.match(loaderRegex);
    var inUseArray = Array.isArray(rule.use) && rule.use.find(function (loader) {
      return typeof loader.loader === 'string' && loader.loader.match(loaderRegex) || typeof loader === 'string' && loader.match(loaderRegex);
    });
    return inUseArray || inLoaderString;
  };
};

module.exports = makeLoaderFinder;