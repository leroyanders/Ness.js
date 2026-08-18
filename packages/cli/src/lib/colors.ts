const ANSI = {
  blue: 34,
  bold: 1,
  cyan: 36,
  green: 32,
  red: 31,
  yellow: 33,
};

export type ColorName = keyof typeof ANSI;

export function paint(format: ColorName | ColorName[], value: unknown): string {
  if (!process.stdout.isTTY) return String(value);
  const opening = [format]
    .flat()
    .map(name => `\u001B[${ANSI[name]}m`)
    .join('');
  return `${opening}${String(value)}\u001B[0m`;
}
