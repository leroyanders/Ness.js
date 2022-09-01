var chalk = require("chalk");

module.exports = function (opts) {
  var optionsTypes = opts.types;
  var onWarning = null;
  opts.caller(function (caller) {
    onWarning = caller.onWarning;
    return "";
  });
  if (typeof onWarning !== "function") return {
    visitor: {}
  };
  var warn = onWarning;
  return {
    visitor: {
      ExportDefaultDeclaration: function ExportDefaultDeclaration(path) {
        var def = path.node.declaration;
        if (!(def.type === "ArrowFunctionExpression" || def.type === "FunctionDeclaration")) return;

        switch (def.type) {
          case "ArrowFunctionExpression":
            {
              warn([chalk.yellow.bold("Anonymous arrow functions cause Fast Refresh to not preserve local component state."), "Please add a name to your function, for example:", "", chalk.bold("Before"), chalk.cyan("export default () => <div />;"), "", chalk.bold("After"), chalk.cyan("const Named = () => <div />;"), chalk.cyan("export default Named;")].join("\n"));
              break;
            }

          case "FunctionDeclaration":
            {
              var isAnonymous = !Boolean(def.id);

              if (isAnonymous) {
                warn([chalk.yellow.bold("Anonymous function declarations cause Fast Refresh to not preserve local component state."), "Please add a name to your function, for example:", "", chalk.bold("Before"), chalk.cyan("export default function () { /* ... */ }"), "", chalk.bold("After"), chalk.cyan("export default function Named() { /* ... */ }")].join("\n"));
              }

              break;
            }

          default:
            {
              var never = def;
            }
        }
      }
    }
  };
};