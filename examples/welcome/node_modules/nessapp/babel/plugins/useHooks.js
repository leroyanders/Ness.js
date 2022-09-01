var isHookRegex = /^use(Callback|Context|DebugValue|Effect|ImperativeHandle|LayoutEffect|Memo|Reducer|Ref|State)$/;
var isHook = /^use[A-Z]/;

module.exports = function (opts) {
  var optionsTypes = opts.types;
  var visitor = {
    CallExpression: function CallExpression(path, state) {
      var onlyBuiltIns = state.opts.onlyBuiltIns;
      var libs = state.opts.lib && (state.opts.lib === true ? ["react", "preact/hooks"] : [].concat(state.opts.lib));
      if (!optionsTypes.isVariableDeclarator(path.parent)) return;
      if (!optionsTypes.isArrayPattern(path.parent.id)) return;
      var hookName = path.node.callee.name;

      if (libs) {
        var binding = path.scope.getBinding(hookName);
        if (!binding || binding.kind !== "module") return;
        var specifier = binding.path.parent.source.value;
        if (!libs.some(function (lib) {
          return lib === specifier;
        })) return;
      }

      if (!(onlyBuiltIns ? isHookRegex : isHook).test(hookName)) return;
      path.parent.id = optionsTypes.objectPattern(path.parent.id.elements.reduce(function (patterns, element, i) {
        if (element === null) return patterns;
        return patterns.concat(optionsTypes.objectProperty(optionsTypes.numericLiteral(i), element));
      }, []));
    }
  };
  return {
    name: "optimize-hook-destructuring",
    visitor: {
      Program: function Program(path, state) {
        path.traverse(visitor, state);
      }
    }
  };
};