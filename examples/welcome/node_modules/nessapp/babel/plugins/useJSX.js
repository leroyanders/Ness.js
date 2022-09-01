var _createForOfIteratorHelper = require("@babel/runtime/helpers/createForOfIteratorHelper").default;

var _slicedToArray = require("@babel/runtime/helpers/slicedToArray").default;

module.exports = function (opts) {
  var optionsTypes = opts.types;
  return {
    inherits: require("babel-plugin-syntax-jsx"),
    visitor: {
      JSXElement: function JSXElement(_path, state) {
        state.set("jsx", true);
      },
      JSXFragment: function JSXFragment(_path, state) {
        state.set("jsx", true);
      },
      Program: {
        exit: function exit(path, state) {
          if (state.get("jsx")) {
            var pragma = optionsTypes.identifier(state.opts.pragma);
            var importAs = pragma;
            var existingBinding = state.opts.reuseImport !== false && state.opts.importAs && path.scope.getBinding(state.opts.importAs);

            if (state.opts.property) {
              if (state.opts.importAs) {
                importAs = optionsTypes.identifier(state.opts.importAs);
              } else {
                importAs = path.scope.generateUidIdentifier("pragma");
              }

              var mapping = optionsTypes.variableDeclaration("var", [optionsTypes.variableDeclarator(pragma, optionsTypes.memberExpression(importAs, optionsTypes.identifier(state.opts.property)))]);
              var newPath;

              if (existingBinding && optionsTypes.isVariableDeclarator(existingBinding.path.node) && optionsTypes.isCallExpression(existingBinding.path.node.init) && optionsTypes.isIdentifier(existingBinding.path.node.init.callee) && existingBinding.path.node.init.callee.name === "require") {
                var _existingBinding$path = existingBinding.path.parentPath.insertAfter(mapping);

                var _existingBinding$path2 = _slicedToArray(_existingBinding$path, 1);

                newPath = _existingBinding$path2[0];
              } else {
                var _path$unshiftContaine = path.unshiftContainer("body", mapping);

                var _path$unshiftContaine2 = _slicedToArray(_path$unshiftContaine, 1);

                newPath = _path$unshiftContaine2[0];
              }

              var _iterator = _createForOfIteratorHelper(newPath.get("declarations")),
                  _step;

              try {
                for (_iterator.s(); !(_step = _iterator.n()).done;) {
                  var declar = _step.value;
                  path.scope.registerBinding(newPath.node.kind, declar);
                }
              } catch (err) {
                _iterator.e(err);
              } finally {
                _iterator.f();
              }
            }

            if (!existingBinding) {
              var importSpecifier = optionsTypes.importDeclaration([state.opts["import"] ? optionsTypes.importSpecifier(importAs, optionsTypes.identifier(state.opts["import"])) : state.opts.importNamespace ? optionsTypes.importNamespaceSpecifier(importAs) : optionsTypes.importDefaultSpecifier(importAs)], optionsTypes.stringLiteral(state.opts.module || "react"));

              var _path$unshiftContaine3 = path.unshiftContainer("body", importSpecifier),
                  _path$unshiftContaine4 = _slicedToArray(_path$unshiftContaine3, 1),
                  _newPath = _path$unshiftContaine4[0];

              var _iterator2 = _createForOfIteratorHelper(_newPath.get("specifiers")),
                  _step2;

              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  var specifier = _step2.value;
                  path.scope.registerBinding("module", specifier);
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
            }
          }
        }
      }
    }
  };
};