var createSocketUrl = require('webpack-dev-server/client/utils/createSocketUrl');
var launchEditorEndpoint = require('react-dev-utils/launchEditorEndpoint');
var formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
var ErrorOverlay = require('react-error-overlay');
var socketUrl = createSocketUrl();
var SockJS = require('sockjs-client');
var stripAnsi = require('strip-ansi');
var url = require('url');

var parsedSocketUrl = url.parse(socketUrl);
ErrorOverlay.setEditorHandler(function editorHandler(errorLocation) {
  fetch(url.format({
    protocol: parsedSocketUrl.protocol,
    hostname: parsedSocketUrl.hostname,
    port: parsedSocketUrl.port,
    pathname: launchEditorEndpoint,
    search: '?fileName=' + window.encodeURIComponent(errorLocation.fileName) + '&lineNumber=' + window.encodeURIComponent(errorLocation.lineNumber || 1) + '&colNumber=' + window.encodeURIComponent(errorLocation.colNumber || 1)
  }), {
    mode: 'no-cors'
  });
});
var hadRuntimeError = false;
ErrorOverlay.startReportingRuntimeErrors({
  onError: function onError() {
    hadRuntimeError = true;
  },
  filename: process.env.REACT_BUNDLE_PATH || '/static/js/bundle.js'
});

if (module.hot && typeof module.hot.dispose === 'function') {
  module.hot.dispose(function () {
    ErrorOverlay.stopReportingRuntimeErrors();
  });
}

var connection = new SockJS(socketUrl);

connection.onclose = function () {
  if (typeof console !== 'undefined' && typeof console.info === 'function') console.info('The development server has disconnected.\nRefresh the page if necessary.');
};

var isFirstCompilation = true;
var mostRecentCompilationHash = null;
var hasCompileErrors = false;

function clearOutdatedErrors() {
  if (typeof console !== 'undefined' && typeof console.clear === 'function') {
    if (hasCompileErrors) console.clear();
  }
} // Successful compilation.


function handleSuccess() {
  clearOutdatedErrors();
  var isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;
  if (isHotUpdate) tryApplyUpdates(function onHotUpdateSuccess() {
    tryDismissErrorOverlay();
  });
}

function handleWarnings(warnings) {
  clearOutdatedErrors();
  var isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  function printWarnings() {
    var formatted = formatWebpackMessages({
      warnings: warnings,
      errors: []
    });

    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      for (var i = 0; i < formatted.warnings.length; i++) {
        if (i === 5) {
          console.warn('There were more warnings in other files.\n' + 'You can find a complete log in the terminal.');
          break;
        }

        console.warn(stripAnsi(formatted.warnings[i]));
      }
    }
  }

  if (isHotUpdate) tryApplyUpdates(function onSuccessfulHotUpdate() {
    printWarnings();
    tryDismissErrorOverlay();
  });else printWarnings();
}

function handleErrors(errors) {
  clearOutdatedErrors();
  isFirstCompilation = false;
  hasCompileErrors = true;
  var formatted = formatWebpackMessages({
    errors: errors,
    warnings: []
  });
  ErrorOverlay.reportBuildError(formatted.errors[0]);

  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    for (var i = 0; i < formatted.errors.length; i++) {
      console.error(stripAnsi(formatted.errors[i]));
    }
  }
}

function tryDismissErrorOverlay() {
  if (!hasCompileErrors) ErrorOverlay.dismissBuildError();
}

function handleAvailableHash(hash) {
  mostRecentCompilationHash = hash;
}

connection.onmessage = function (e) {
  var message = JSON.parse(e.data);

  switch (message.type) {
    case 'hash':
      handleAvailableHash(message.data);
      break;

    case 'still-ok':
    case 'ok':
      handleSuccess();
      break;

    case 'content-changed':
      window.location.reload();
      break;

    case 'warnings':
      handleWarnings(message.data);
      break;

    case 'errors':
      handleErrors(message.data);
      break;

    default:
  }
};

function isUpdateAvailable() {
  return mostRecentCompilationHash !== __webpack_hash__;
}

function canApplyUpdates() {
  return module.hot.status() === 'idle';
}

function tryApplyUpdates(onHotUpdateSuccess) {
  if (!module.hot) return window.location.reload();
  if (!isUpdateAvailable() || !canApplyUpdates()) return;

  function isUpdatesExists(err, updatedModules) {
    if (err || !updatedModules || hadRuntimeError) return window.location.reload();
    if (typeof onHotUpdateSuccess === 'function') onHotUpdateSuccess();
    if (isUpdateAvailable()) tryApplyUpdates();
  }

  var isThereUpdates = module.hot.check(
  /* autoApply */
  true, isUpdatesExists);

  if (isThereUpdates && isThereUpdates.then) {
    isThereUpdates.then(function (updatedModules) {
      isUpdatesExists(null, updatedModules);
    }, function (err) {
      isUpdatesExists(err, null);
    });
  }
}