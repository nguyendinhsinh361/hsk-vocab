import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

/** Băm mật khẩu bằng scrypt (built-in) → chuỗi "saltHex:hashHex". */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** So khớp mật khẩu với chuỗi đã băm (timing-safe). */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored || !stored.includes(':')) return false;
  const [saltHex, hashHex] = stored.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
