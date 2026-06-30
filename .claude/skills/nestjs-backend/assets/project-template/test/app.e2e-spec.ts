import './setup-env';

import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Boots the real AppModule (guards, pipe, envelope interceptor, exception
 * filter, CLS middleware) with only PrismaService replaced by an in-memory
 * stub — proving the response contract end-to-end without a database. The
 * cache runs on the real in-memory driver (CACHE_DRIVER defaults to memory
 * in test), so no Redis is needed either.
 * Note: the global '/api' prefix is applied in main.ts, not here.
 */
const ownerPassword = 'correct-horse-battery';
let ownerPasswordHash = ''; // argon2 hash, computed in beforeAll

const ownerRow = () => ({
  id: 1,
  email: 'owner@example.com',
  role: 'user',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

interface TokenRow {
  id: string;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/** Map-backed refresh-token table (mirrors the unit-test fake). */
const tokenRows = new Map<string, TokenRow>();
const liveTokens = (userId: number) =>
  [...tokenRows.values()].filter((r) => r.userId === userId && r.revokedAt === null);

const prismaStub = {
  user: {
    // public queries pass omit: { passwordHash: true } — the stub honors it by
    // never returning the hash unless the where clause is the auth-flow email lookup
    create: ({ data }: { data: { email: string } }) =>
      Promise.resolve({ ...ownerRow(), email: data.email }),
    findUnique: ({ where }: { where: { id?: number; email?: string } }) => {
      if (where.email !== undefined) {
        return Promise.resolve(
          where.email === 'owner@example.com'
            ? { ...ownerRow(), passwordHash: ownerPasswordHash }
            : null,
        );
      }
      return Promise.resolve(ownerRow());
    },
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  },
  refreshToken: {
    create: ({
      data,
    }: {
      data: { id: string; userId: number; tokenHash: string; expiresAt: Date };
    }) => {
      const row: TokenRow = { ...data, revokedAt: null, createdAt: new Date() };
      tokenRows.set(data.id, row);
      return Promise.resolve(row);
    },
    findUnique: ({ where }: { where: { id: string } }) =>
      Promise.resolve(tokenRows.get(where.id) ?? null),
    update: ({ where, data }: { where: { id: string }; data: { revokedAt: Date } }) => {
      const row = tokenRows.get(where.id);
      if (!row) return Promise.reject(new Error('P2025: record not found'));
      row.revokedAt = data.revokedAt;
      return Promise.resolve(row);
    },
    updateMany: ({
      where,
      data,
    }: {
      where: { id?: string; userId: number; revokedAt: null };
      data: { revokedAt: Date };
    }) => {
      let count = 0;
      for (const row of tokenRows.values()) {
        if (row.userId !== where.userId) continue;
        if (where.id !== undefined && row.id !== where.id) continue;
        if (row.revokedAt !== null) continue;
        row.revokedAt = data.revokedAt;
        count += 1;
      }
      return Promise.resolve({ count });
    },
  },
  // health ping ($queryRaw`SELECT 1`)
  $queryRaw: () => Promise.resolve([{ '?column?': 1 }]),
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
};

describe('App (e2e, PrismaService stubbed, in-memory cache driver)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ownerPasswordHash = await argon2.hash(ownerPassword);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps success in the envelope and echoes x-request-id (@Public route)', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('x-request-id', 'corr-e2e-1')
      .send({ email: 'new@example.com', password: 'long-enough-password' })
      .expect(201);

    expect(res.headers['x-request-id']).toBe('corr-e2e-1');
    expect(res.body).toMatchObject({
      success: true,
      data: { email: 'new@example.com', role: 'user' },
      correlationId: 'corr-e2e-1',
    });
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('funnels validation failures into the error envelope with field details', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
    expect(typeof res.body.correlationId).toBe('string');
  });

  it('guards routes by default: 401 UNAUTHENTICATED envelope without a token', async () => {
    const res = await request(app.getHttpServer()).get('/users/1').expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(typeof res.body.correlationId).toBe('string');
    expect(res.body.correlationId).not.toBe('n/a');
  });

  it('accepts a signed bearer token end-to-end', async () => {
    const token = await app
      .get(JwtService)
      .signAsync({ sub: 1, role: 'user' }, { secret: process.env.JWT_SECRET, expiresIn: '5m' });

    const res = await request(app.getHttpServer())
      .get('/users/1')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({ success: true, data: { id: 1 } });
  });

  describe('auth flow (login → @CurrentUser route → refresh rotation → logout)', () => {
    let issued: { accessToken: string; refreshToken: string };

    it('POST /auth/login returns tokens + user and stores a hashed refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'owner@example.com', password: ownerPassword })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
      expect(res.body.data.user).toMatchObject({ id: 1, email: 'owner@example.com' });
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      // stored server-side as sha256, never verbatim
      const stored = liveTokens(1);
      expect(stored.length).toBeGreaterThan(0);
      expect(stored.map((r) => r.tokenHash)).not.toContain(res.body.data.refreshToken);
      issued = res.body.data;
    });

    it('rejects a wrong password with the generic 401 envelope', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'owner@example.com', password: 'wrong-password' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('serves a @CurrentUser route with the issued access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/1')
        .set('authorization', `Bearer ${issued.accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ success: true, data: { id: 1 } });
    });

    it('POST /auth/refresh rotates the pair and rejects reuse of the old token', async () => {
      const rotated = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: issued.refreshToken })
        .expect(200);

      expect(typeof rotated.body.data.accessToken).toBe('string');
      expect(rotated.body.data.refreshToken).not.toBe(issued.refreshToken);

      // replaying the rotated-out token is reuse → 401 and family revoked
      const reuse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: issued.refreshToken })
        .expect(401);
      expect(reuse.body.error.code).toBe('UNAUTHENTICATED');
      expect(liveTokens(1)).toHaveLength(0);
    });

    it('POST /auth/logout revokes the presented refresh token', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'owner@example.com', password: ownerPassword })
        .expect(200);
      const pair = login.body.data as { accessToken: string; refreshToken: string };

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('authorization', `Bearer ${pair.accessToken}`)
        .send({ refreshToken: pair.refreshToken })
        .expect(200);

      expect(liveTokens(1)).toHaveLength(0);
    });
  });

  it('does NOT wrap terminus health output (@SkipEnvelope)', async () => {
    const res = await request(app.getHttpServer()).get('/health/live').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body).not.toHaveProperty('success');
    expect(res.body).not.toHaveProperty('data');
  });

  it('reports readiness: database checked, redis excluded for the memory driver', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.details.database.status).toBe('up');
    // CACHE_DRIVER=memory → no external cache dependency to gate readiness on
    expect(res.body.details).not.toHaveProperty('redis');
    expect(res.body).not.toHaveProperty('success');
  });
});
