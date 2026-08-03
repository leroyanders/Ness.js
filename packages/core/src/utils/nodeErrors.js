// Keep stack traces readable when server bundles use webpack source URLs.
const prepareStackTrace = Error.prepareStackTrace;
Error.prepareStackTrace = (error, trace) => {
  const stack = prepareStackTrace
    ? prepareStackTrace(error, trace)
    : `${error.name}: ${error.message}\n${trace.join('\n')}`;
  return String(stack).replaceAll('/build/webpack:', '');
};
