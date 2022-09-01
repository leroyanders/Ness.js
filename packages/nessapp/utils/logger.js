var _typeof = require("@babel/runtime/helpers/typeof").default;

var chalk = require('chalk');

var loggingTypes = {
  warn: {
    backgroundColor: 'bgYellow',
    message: ' WARNING ',
    text: 'yellow'
  },
  debug: {
    backgroundColor: 'bgMagenta',
    message: ' DEBUG ',
    text: 'magenta'
  },
  info: {
    backgroundColor: 'bgCyan',
    message: ' INFO ',
    text: 'cyan'
  },
  error: {
    backgroundColor: 'bgRed',
    message: ' ERROR ',
    text: 'red'
  },
  start: {
    backgroundColor: 'bgCyan',
    message: ' WAITING ',
    text: 'cyan'
  },
  done: {
    backgroundColor: 'bgGreen',
    message: ' DONE ',
    text: 'green'
  }
};

var write = function write(type, text, verbose) {
  var logType = loggingTypes[type];
  var textToLog = '';
  var logObject = false;
  textToLog += chalk[logType.backgroundColor].black(logType.message) + ' ' + chalk[logType.text](text);

  if (verbose) {
    if (_typeof(verbose) === 'object') logObject = true;else textToLog += "\n\n".concat(verbose);
  }

  console.log(textToLog);
  if (['start', 'done', 'error'].indexOf(type) > -1) console.log();
  if (logObject) console.dir(verbose, {
    depth: 15
  });
};

var log = function log() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return console.log(text);
};

var start = function start() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return write('start', text);
};

var done = function done() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return write('done', text);
};

var info = function info() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return write('info', text);
};

var debug = function debug(text, data) {
  return write('debug', text, data);
};

var warn = function warn(text, data) {
  return write('warn', text, data);
};

var error = function error(text, err) {
  return write('error', text, err);
};

module.exports = {
  log: log,
  info: info,
  debug: debug,
  warn: warn,
  error: error,
  start: start,
  done: done
};