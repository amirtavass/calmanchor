/**
 * Row identifiers for locally-created records (M3-07).
 *
 * The client generates the primary key for anything it writes, so a retried
 * outbox insert is idempotent: the same `id` hits the same `unique`/`primary key`
 * and cannot create a duplicate. That is what makes an offline queue safe to
 * flush more than once.
 *
 * UUID v4 per RFC 4122. Randomness comes from `Math.random` — fine for row
 * identity (these are not security tokens).
 */
export function newId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex: string[] = [];
  for (let i = 0; i < 16; i += 1) hex.push(bytes[i].toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}
