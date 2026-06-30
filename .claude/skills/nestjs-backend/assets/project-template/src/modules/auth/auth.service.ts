import { createHash, randomUUID } from 'node:crypto';

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { parseTtlSeconds } from '../../common/ttl';
import { authConfig } from '../../config/auth.config';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../iam/auth-user';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { TokenPairDto } from './dto/token-pair.dto';

/** One message for unknown email AND wrong password — no user enumeration. */
const INVALID_CREDENTIALS = 'Invalid credentials';
const INVALID_REFRESH = 'Invalid refresh token';

/** Valid argon2id hash of a random throwaway string: when the email is unknown
 *  we still verify against it, so both login failures cost one argon2.verify
 *  (no timing side channel revealing whether the account exists). */
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$K5oc/cWCjNrrOHiYZE63XQ$4Jz4z8UDN279Nlr0e9QOjdOmBscEN2MsRSLo+Cu9WY8';

/** Refresh JWT claims. `typ` discriminates: an access token must never pass as
 *  a refresh token (it carries no jti and was never stored). */
interface RefreshPayload {
  sub: number;
  role: AuthUser['role'];
  jti: string;
  typ: string;
}

/**
 * Owns the token lifecycle (issue / rotate / revoke); user persistence stays
 * in UsersService (SRP). Refresh-token state lives in Postgres (RefreshToken
 * model), NOT in the cache: it is durable auth data that must survive a Redis
 * flush, and revoked rows (revokedAt) remain for audit and reuse detection.
 * Only the sha256 of the token is stored — a DB dump alone cannot mint a
 * session. Expiry is enforced by the expiresAt check; purge expired/revoked
 * rows with a periodic cleanup job (deleteMany), not at request time.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmailWithHash(dto.email);
    const matches = await argon2
      .verify(user?.passwordHash ?? DUMMY_HASH, dto.password)
      .catch(() => false);
    if (!user || !matches) throw new UnauthorizedException(INVALID_CREDENTIALS);
    const { accessToken, refreshToken } = await this.issueTokenPair({
      id: user.id,
      role: user.role as AuthUser['role'], // DB default + service-owned writes keep this in the Role union
    });
    return { accessToken, refreshToken, user: UserResponseDto.from(user) };
  }

  /** Rotation: every refresh token is single-use. Presenting a token whose row
   *  is revoked, tampered with, or gone — while its signature is still valid —
   *  is treated as theft: the whole session family is revoked. */
  async refresh(refreshToken: string): Promise<TokenPairDto> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    // stored?.revokedAt !== null covers both "row missing" and "already revoked"
    if (
      stored?.revokedAt !== null ||
      stored.userId !== payload.sub ||
      stored.tokenHash !== this.sha256(refreshToken)
    ) {
      await this.revokeAllSessions(payload.sub); // reuse detection
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    // defense in depth: the JWT exp matches expiresAt, but the row is the truth
    if (stored.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException(INVALID_REFRESH);
    await this.prisma.refreshToken.update({
      where: { id: payload.jti },
      data: { revokedAt: new Date() },
    });
    return this.issueTokenPair({ id: payload.sub, role: payload.role });
  }

  /** Revokes the presented refresh token. The (short-lived) access token simply
   *  expires; to log out everywhere, call revokeAllSessions instead. */
  async logout(current: AuthUser, refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    if (payload.sub !== current.id) throw new UnauthorizedException(INVALID_REFRESH);
    // updateMany (not update): revoking an already-revoked/absent token is a no-op, not a 500
    await this.prisma.refreshToken.updateMany({
      where: { id: payload.jti, userId: current.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** "Log out everywhere": revokes every live refresh token of the user. */
  async revokeAllSessions(userId: number): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  private async issueTokenPair(user: AuthUser): Promise<TokenPairDto> {
    const jti = randomUUID();
    const refreshTtlSeconds = parseTtlSeconds(this.auth.refreshTtl);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, role: user.role },
        { secret: this.auth.jwtSecret, expiresIn: parseTtlSeconds(this.auth.accessTtl) },
      ),
      this.jwt.signAsync(
        { sub: user.id, role: user.role, jti, typ: 'refresh' },
        { secret: this.auth.jwtSecret, expiresIn: refreshTtlSeconds },
      ),
    ]);
    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        tokenHash: this.sha256(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtlSeconds * 1_000),
      },
    });
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<RefreshPayload> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(token, { secret: this.auth.jwtSecret });
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    if (payload.typ !== 'refresh') throw new UnauthorizedException(INVALID_REFRESH);
    return payload;
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
