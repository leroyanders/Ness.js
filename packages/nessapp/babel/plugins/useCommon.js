var common = require("@babel/plugin-transform-modules-commonjs");

module.exports = function (api, options, dirname) {
  var commonjs = common["default"](api, options, dirname);
  return {
    visitor: {
      Program: {
        exit: function exit(path, state) {
          var foundModuleExports = false;
          path.traverse({
            MemberExpression: function MemberExpression(expressionPath) {
              if (expressionPath.node.object.name !== "module") return;
              if (expressionPath.node.property.name !== "exports") return;
              foundModuleExports = true;
            }
          });
          if (!foundModuleExports) return;
          commonjs.visitor.Program.exit.call(this, path, state);
        }
      }
    }
  };
};