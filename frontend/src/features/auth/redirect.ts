/**
 * Where to send a user after they sign in: the in-app path they originally asked
 * for, or "/". Only same-app paths are allowed, to avoid open redirects
 * ("//evil.example" is protocol-relative, so it is rejected too).
 */
export function safeRedirectTarget(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}
