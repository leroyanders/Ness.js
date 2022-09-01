function loadPlugin(plugin) {
  if (typeof plugin === 'string') {
    return loadPlugin({ name: plugin }, paths);
  }

  if (typeof plugin === 'function') {
    return [plugin, {}];
  }

  if (typeof plugin === 'object' && !plugin.name && !plugin.object) {
    return [plugin, {}];
  }

  if (typeof plugin.func === 'function') {
    return [plugin.func, plugin.options];
  }

  if (typeof plugin.object === 'object') {
    return [plugin.object, plugin.options];
  }

  const isScopedPlugin = plugin.name.startsWith('@') && plugin.name.includes('/');
  let scope;
  let scopedPluginName;
  if (isScopedPlugin) {
    const pluginNameParts = plugin.name.split("/");
    scope = pluginNameParts[0];
    scopedPluginName = pluginNameParts[1]
  }

  const completePluginNames = [
    isScopedPlugin && `${scope}/ness-${scopedPluginName}`,
    isScopedPlugin && plugin.name,
    `ness-${plugin.name}`
  ].filter(Boolean);

  // Try to find the plugin in node_modules
  let nessPlugin = null;
  for (const completePluginName of completePluginNames) {
    try {
      nessPlugin = require(completePluginName);
    // eslint-disable-next-line no-empty
    } catch (error) {}
    
    if (nessPlugin) {
      break;
    }
  }
  if (!nessPlugin) {
    const last = completePluginNames.pop();
    throw new Error(`Unable to find '${completePluginNames.join("', '")}' or ${last}'`);
  }

  return nessPlugin;
}

function loadPlugins(plugin) {
    return loadPlugin(plugin);
}

module.exports = loadPlugins;
