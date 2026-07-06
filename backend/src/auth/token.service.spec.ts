import type { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

function makeService(secret = 'test-secret'): TokenService {
  const config = { get: () => secret } as unknown as ConfigService;
  return new TokenService(config);
}

describe('TokenService', () => {
  it('sign → verify roundtrip trả đúng payload', () => {
    const svc = makeService();
    const token = svc.sign({ sub: 'user-1', email: 'a@b.c' });
    const payload = svc.verify(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-1');
    expect(payload!.email).toBe('a@b.c');
    expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('token bị sửa payload → null', () => {
    const svc = makeService();
    const token = svc.sign({ sub: 'user-1', email: 'a@b.c' });
    const [h, , s] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ sub: 'user-2', email: 'x@y.z', exp: 9999999999 }),
      'utf8',
    ).toString('base64url');
    expect(svc.verify(`${h}.${forged}.${s}`)).toBeNull();
  });

  it('sai secret → null', () => {
    const token = makeService('secret-a').sign({ sub: 'u', email: 'e@e.e' });
    expect(makeService('secret-b').verify(token)).toBeNull();
  });

  it('token hết hạn → null', () => {
    const svc = makeService();
    const token = svc.sign({ sub: 'u', email: 'e@e.e' }, -10); // hết hạn 10s trước
    expect(svc.verify(token)).toBeNull();
  });

  it('chuỗi rác → null (không ném exception)', () => {
    const svc = makeService();
    expect(svc.verify('')).toBeNull();
    expect(svc.verify('a.b')).toBeNull();
    expect(svc.verify('a.b.c')).toBeNull();
  });
});
