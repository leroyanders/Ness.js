export interface ForwardedOptions {
  /**
   * Honour `X-Forwarded-Proto` and `X-Forwarded-Host`.
   *
   * Off by default. These headers come from the client unless something in
   * front overwrites them, so trusting them on a directly exposed server lets
   * anyone rewrite the host the application believes it is serving.
   */
  trustProxy?: boolean;
}

/** The first value of a comma-separated forwarded header. */
export function firstValue(header: string | null): string | undefined;

/** `http` or `https` from `X-Forwarded-Proto`, or undefined. */
export function forwardedProtocol(headers: Headers): string | undefined;

/** A syntactically valid host from `X-Forwarded-Host`, or undefined. */
export function forwardedHost(headers: Headers): string | undefined;

/**
 * Returns the request with the scheme and host the client used, or the same
 * request when nothing needs correcting.
 */
export function applyForwardedHeaders(
  request: Request,
  options?: ForwardedOptions,
): Request;
