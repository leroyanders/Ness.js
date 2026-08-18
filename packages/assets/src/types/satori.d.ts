/**
 * satori is an optional peer: only applications that render share cards
 * install it. Declared here so this package type-checks without it, which is
 * the whole point of it being optional.
 */
declare module 'satori' {
  const satori: (
    element: unknown,
    options: Record<string, unknown>,
  ) => Promise<string>;
  export default satori;
}
