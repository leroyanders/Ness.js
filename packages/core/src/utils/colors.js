const ANSI = {
  black: 30,
  blue: 34,
  bold: 1,
  cyan: 36,
  green: 32,
  magenta: 35,
  red: 31,
  yellow: 33,
  bgCyan: 46,
  bgBlue: 44,
  bgGreen: 42,
  bgMagenta: 45,
  bgRed: 41,
  bgYellow: 43,
};

function paint(format, value) {
  if (!process.stdout.isTTY) return String(value);
  const opening = [format]
    .flat()
    .map(name => `\u001B[${ANSI[name]}m`)
    .join('');
  return `${opening}${String(value)}\u001B[0m`;
}

const blue = value => paint('blue', value);
const cyan = value => paint('cyan', value);
const green = value => paint('green', value);
const red = value => paint('red', value);
const yellow = value => paint('yellow', value);
const bold = value => paint('bold', value);

export { blue, bold, cyan, green, paint, red, yellow };
