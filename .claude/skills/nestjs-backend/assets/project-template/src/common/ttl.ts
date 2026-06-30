const TTL_PATTERN = /^(\d+)([smhd])?$/;
const SECONDS_PER_UNIT = { s: 1, m: 60, h: 3_600, d: 86_400 } as const;

/**
 * Converts the jsonwebtoken-style TTL strings used in authConfig ('900s',
 * '30d', bare seconds) into seconds, e.g. for Redis EX arguments.
 * Throws on anything else — a silent fallback TTL would be a security bug.
 */
export function parseTtlSeconds(ttl: string): number {
  const match = TTL_PATTERN.exec(ttl);
  const amount = match?.[1];
  if (amount === undefined) throw new Error(`Unsupported TTL format: "${ttl}"`);
  const unit = (match?.[2] ?? 's') as keyof typeof SECONDS_PER_UNIT;
  return Number(amount) * SECONDS_PER_UNIT[unit];
}
