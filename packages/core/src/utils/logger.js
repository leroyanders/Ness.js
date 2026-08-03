import * as colors from './colors.js';

const loggingTypes = {
  warn: { background: 'bgYellow', label: ' WARNING ', text: 'yellow' },
  debug: { background: 'bgMagenta', label: ' DEBUG ', text: 'magenta' },
  info: { background: 'bgCyan', label: ' INFO ', text: 'cyan' },
  error: { background: 'bgRed', label: ' ERROR ', text: 'red' },
  start: { background: 'bgCyan', label: ' WAITING ', text: 'cyan' },
  done: { background: 'bgGreen', label: ' DONE ', text: 'green' },
};

function write(type, text, details) {
  const format = loggingTypes[type];
  console.log(
    `${colors.paint([format.background, 'black'], format.label)} ${colors.paint(format.text, text)}`,
  );
  if (details instanceof Error) console.error(details.stack || details.message);
  else if (details && typeof details === 'object')
    console.dir(details, { depth: 15 });
  else if (details) console.log(`\n${details}`);
  if (['start', 'done', 'error'].includes(type)) console.log();
}

const logger = {
  log: (text = '') => console.log(text),
  info: (text = '') => write('info', text),
  debug: (text, details) => write('debug', text, details),
  warn: (text, details) => write('warn', text, details),
  error: (text, details) => write('error', text, details),
  start: (text = '') => write('start', text),
  done: (text = '') => write('done', text),
};

export default logger;
