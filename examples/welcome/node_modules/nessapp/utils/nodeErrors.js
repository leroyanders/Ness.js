var _objectSpread = require("@babel/runtime/helpers/objectSpread2").default;
var _objectWithoutProperties = require("@babel/runtime/helpers/objectWithoutProperties").default;
var _excluded = ["stack"];
var fs = require('fs');

var _require = require('jest-message-util'),
    getTopFrame = _require.getTopFrame,
    getStackTraceLines = _require.getStackTraceLines,
    separateMessageFromStack = _require.separateMessageFromStack;

var _require2 = require('@babel/code-frame'),
    codeFrameColumns = _require2.codeFrameColumns;

function pretty(error) {
  var message = error.message,
      stack = error.stack;
  var lines = getStackTraceLines(stack);
  var topFrame = getTopFrame(lines);
  var fallback = "".concat(message).concat(stack);
  if (!topFrame) return fallback;
  var file = topFrame.file,
      line = topFrame.line;

  try {
    var result = codeFrameColumns(fs.readFileSync(file, 'utf8'), {
      start: {
        line: line
      }
    }, {
      highlightCode: true
    });
    return "\n".concat(message, "\n\n").concat(result, "\n").concat(stack, "\n");
  } catch (error) {
    return fallback;
  }
}

function usePrettyErrors(transform) {
  var prepareStackTrace = Error.prepareStackTrace;

  Error.prepareStackTrace = function (error, trace) {
    var prepared = prepareStackTrace ? separateMessageFromStack(prepareStackTrace(error, trace)) : error;
    var transformed = transform ? transform(prepared) : prepared;
    return pretty(transformed);
  };
}

var stackTransform = function stackTransform(_ref) {
  var _ref$stack = _ref.stack,
      stack = _ref$stack === void 0 ? '' : _ref$stack,
      rest = _objectWithoutProperties(_ref, _excluded);

  return _objectSpread({
    stack: stack.replace('/build/webpack:', '')
  }, rest);
}; // eslint-disable-next-line


usePrettyErrors(stackTransform);