const ANSI = {
  blue: 34,
  bold: 1,
  cyan: 36,
  green: 32,
  red: 31,
  yellow: 33,
};

export function paint(format, value) {
  if (!process.stdout.isTTY) return String(value);
  const opening = [format]
    .flat()
    .map(name => `\u001B[${ANSI[name]}m`)
    .join('');
  return `${opening}${String(value)}\u001B[0m`;
}
