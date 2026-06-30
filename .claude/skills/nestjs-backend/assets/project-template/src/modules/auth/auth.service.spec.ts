import { createHash } from 'node:crypto';

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';

import { authConfig } from '../../config/auth.config';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

interface TokenRow {
  id: string;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmailWithHash: jest.Mock };
  let rows: Map<string, TokenRow>;
  let passwordHash: string;

  const credentials = { email: 'owner@example.com', password: 'correct-password' };
  const user = () => ({
    id: 1,
    email: credentials.email,
    role: 'user',
    passwordHash,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
  const liveRows = () => [...rows.values()].filter((r) => r.revokedAt === null);

  /** Map-backed stand-in for prisma.refreshToken — no real database. */
  const prismaFake = () => ({
    refreshToken: {
      create: ({
        data,
      }: {
        data: { id: string; userId: number; tokenHash: string; expiresAt: Date };
      }) => {
        const tokenRow: TokenRow = { ...data, revokedAt: null, createdAt: new Date() };
        rows.set(data.id, tokenRow);
        return Promise.resolve(tokenRow);
      },
      findUnique: ({ where }: { where: { id: string } }) =>
        Promise.resolve(rows.get(where.id) ?? null),
      update: ({ where, data }: { where: { id: string }; data: { revokedAt: Date } }) => {
        const tokenRow = rows.get(where.id);
        if (!tokenRow) return Promise.reject(new Error('P2025: record not found'));
        tokenRow.revokedAt = data.revokedAt;
        return Promise.resolve(tokenRow);
      },
      updateMany: ({
        where,
        data,
      }: {
        where: { id?: string; userId: number; revokedAt: null };
        data: { revokedAt: Date };
      }) => {
        let count = 0;
        for (const tokenRow of rows.values()) {
          if (tokenRow.userId !== where.userId) continue;
          if (where.id !== undefined && tokenRow.id !== where.id) continue;
          if (tokenRow.revokedAt !== null) continue;
          tokenRow.revokedAt = data.revokedAt;
          count += 1;
        }
        return Promise.resolve({ count });
      },
    },
  });

  beforeAll(async () => {
    passwordHash = await argon2.hash(credentials.password);
  });

  beforeEach(async () => {
    rows = new Map();
    usersService = { findByEmailWithHash: jest.fn().mockResolvedValue(null) };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: new JwtService({}) },
        {
          provide: authConfig.KEY,
          useValue: {
            jwtSecret: 'unit-test-secret-unit-test-secret-123456',
            accessTtl: '900s',
            refreshTtl: '30d',
          },
        },
        { provide: PrismaService, useValue: prismaFake() },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('rejects wrong password and unknown email with the same opaque 401', async () => {
    usersService.findByEmailWithHash.mockResolvedValueOnce(user());
    const wrongPassword = await service
      .login({ email: credentials.email, password: 'wrong-password' })
      .then(
        () => null,
        (err: unknown) => err,
      );
    usersService.findByEmailWithHash.mockResolvedValueOnce(null);
    const unknownEmail = await service
      .login({ email: 'ghost@example.com', password: 'whatever-password' })
      .then(
        () => null,
        (err: unknown) => err,
      );

    expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
    expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
    // enumeration-safe: both failures are byte-identical to the client
    expect((unknownEmail as Error).message).toBe((wrongPassword as Error).message);
  });

  it('logs in and stores only a sha256 of the refresh token', async () => {
    usersService.findByEmailWithHash.mockResolvedValue(user());
    const result = await service.login(credentials);

    expect(result.user).not.toHaveProperty('passwordHash');
    const stored = liveRows();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.userId).toBe(1);
    expect(stored[0]?.tokenHash).toBe(
      createHash('sha256').update(result.refreshToken).digest('hex'),
    );
    expect(stored[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rotates refresh tokens: the previous token is revoked', async () => {
    usersService.findByEmailWithHash.mockResolvedValue(user());
    const { refreshToken } = await service.login(credentials);
    const next = await service.refresh(refreshToken);

    expect(next.refreshToken).not.toBe(refreshToken);
    expect(liveRows()).toHaveLength(1); // old jti revoked, exactly one live token
    expect(rows.size).toBe(2); // the revoked row stays for audit (revokedAt set)
    await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('reuse of a rotated token revokes the whole session family', async () => {
    usersService.findByEmailWithHash.mockResolvedValue(user());
    const first = await service.login(credentials);
    const second = await service.refresh(first.refreshToken);

    await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(liveRows()).toHaveLength(0); // family wiped — the rotated-to token dies too
    await expect(service.refresh(second.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuses an access token on refresh (typ claim discriminates)', async () => {
    usersService.findByEmailWithHash.mockResolvedValue(user());
    const result = await service.login(credentials);
    await expect(service.refresh(result.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout revokes the presented refresh token', async () => {
    usersService.findByEmailWithHash.mockResolvedValue(user());
    const result = await service.login(credentials);
    await service.logout({ id: 1, role: 'user' }, result.refreshToken);
    expect(liveRows()).toHaveLength(0);
  });
});
