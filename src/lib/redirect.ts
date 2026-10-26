/** Only allow same-app relative redirects (no protocol-relative or absolute URLs). */
export function safeNext(value: string | null, fallback = '/account') {
  return value && /^\/(?!\/)[\w\-/.?=&%#]*$/.test(value) ? value : fallback;
}
