import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { CacheService, cacheKey } from '../../cache/cache.service';
import { Paginated } from '../../common/dto/paginated';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, User } from '../../generated/prisma/client';
import { AuthUser } from '../../iam/auth-user';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UserResponseDto } from './dto/user-response.dto';

/** Every public query omits the hash at the query level — it never leaves the
 *  database except through findByEmailWithHash (auth flow only). */
const OMIT_PASSWORD_HASH = { passwordHash: true } as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await argon2.hash(dto.password);
    try {
      // insert-and-catch-unique beats check-then-insert (no race window)
      const user = await this.prisma.user.create({
        data: { email: dto.email, passwordHash },
        omit: OMIT_PASSWORD_HASH,
      });
      return UserResponseDto.from(user);
    } catch (err) {
      if (this.isUniqueViolation(err)) throw new ConflictException('Email already registered');
      throw err;
    }
  }

  /** Read-through cache: authorization first (a cache hit must never bypass it),
   *  then cache:users:<id> with the configured TTL on miss. */
  async findById(id: number, current: AuthUser): Promise<UserResponseDto> {
    // resource-level authorization: own profile or admin (IDOR-safe);
    // 404 (not 403) so ids cannot be enumerated
    if (current.id !== id && current.role !== 'admin')
      throw new NotFoundException('User not found');
    const key = cacheKey('users', id);
    const cached = await this.cache.getJson<UserResponseDto>(key);
    if (cached !== null) return cached;
    const user = await this.prisma.user.findUnique({ where: { id }, omit: OMIT_PASSWORD_HASH });
    if (!user) throw new NotFoundException('User not found');
    const dto = UserResponseDto.from(user);
    await this.cache.setJson(key, dto);
    return dto;
  }

  /** Invalidation story: every write to a user row (update/delete/role change)
   *  must call this — TTL is only the backstop for missed invalidations. */
  invalidateCachedUser(id: number): Promise<void> {
    return this.cache.del(cacheKey('users', id));
  }

  /** Auth flow only: the single query that returns passwordHash. Never returned
   *  past AuthService — the API shape stays UserResponseDto. */
  findByEmailWithHash(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async list(query: ListUsersQueryDto): Promise<Paginated<UserResponseDto>> {
    const sortDir = query.sortDir === 'ASC' ? 'asc' : 'desc';
    // sort fields are whitelisted in the DTO (@IsIn) and mapped explicitly here —
    // client input never becomes an ORDER BY identifier
    const orderBy: Prisma.UserOrderByWithRelationInput =
      query.sortBy === 'email' ? { email: sortDir } : { createdAt: sortDir };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        omit: OMIT_PASSWORD_HASH,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count(),
    ]);
    return Paginated.of(
      rows.map((u) => UserResponseDto.from(u)),
      total,
      query.page,
      query.limit,
    );
  }

  /** P2002 = unique constraint violation (data-access.md §4) → 409. */
  private isUniqueViolation(err: unknown): boolean {
    return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
  }
}
