var _regeneratorRuntime = require("@babel/runtime/helpers/regeneratorRuntime").default;
var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator").default;
var _require = require('react-dev-utils/WebpackDevServerUtils'),
    choosePort = _require.choosePort;

module.exports = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
  var port, portDev, actualPort, actualPortDev;
  return _regeneratorRuntime().wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          port = process.env.PORT && parseInt(process.env.PORT) || 3000;
          portDev = process.env.PORT_DEV && parseInt(process.env.PORT_DEV) || port + 1;
          _context.next = 4;
          return choosePort(process.env.HOST, port);

        case 4:
          actualPort = _context.sent;
          _context.next = 7;
          return choosePort(process.env.HOST, portDev);

        case 7:
          actualPortDev = _context.sent;
          process.env.PORT = actualPort;
          process.env.PORT_DEV = actualPortDev;

        case 10:
        case "end":
          return _context.stop();
      }
    }
  }, _callee);
}));