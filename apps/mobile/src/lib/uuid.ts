/** RFC 4122 v4 id. Used as an idempotency key for events, so collision resistance is enough. */
export function uuid(): string {
  const random = globalThis.crypto?.getRandomValues
    ? (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(n))
    : (n: number) =>
        Uint8Array.from({ length: n }, () => Math.floor(Math.random() * 256));
  const b = random(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
