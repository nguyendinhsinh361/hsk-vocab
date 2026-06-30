import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { CacheService } from '../../cache/cache.service';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { AuthUser } from '../../iam/auth-user';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let user: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; count: jest.Mock };
  let cache: { getJson: jest.Mock; setJson: jest.Mock; del: jest.Mock };

  const admin: AuthUser = { id: 99, role: 'admin' };
  const owner: AuthUser = { id: 1, role: 'user' };
  /** What prisma returns for public queries — omit already stripped the hash. */
  const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    email: 'a@b.cd',
    role: 'user',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    user = { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() };
    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        // hand-rolled PrismaService mock: only the delegates the service touches
        { provide: PrismaService, useValue: { user } },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('maps a created user to the response DTO without passwordHash', async () => {
    user.create.mockResolvedValue(row());
    const result = await service.create({ email: 'a@b.cd', password: 'longpassword' });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.email).toBe('a@b.cd');
    // the query itself omits the hash — it never crosses the service boundary
    expect(user.create).toHaveBeenCalledWith(
      expect.objectContaining({ omit: { passwordHash: true } }),
    );
  });

  it('translates P2002 (unique violation) into 409', async () => {
    user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed on email', {
        code: 'P2002',
        clientVersion: '7.8.0',
      }),
    );
    await expect(
      service.create({ email: 'a@b.cd', password: 'longpassword' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('hides other users from non-admins as 404 (no enumeration)', async () => {
    await expect(service.findById(2, owner)).rejects.toBeInstanceOf(NotFoundException);
    expect(user.findUnique).not.toHaveBeenCalled();
    expect(cache.getJson).not.toHaveBeenCalled(); // authorization runs before the cache
  });

  it('lets admin read any user', async () => {
    user.findUnique.mockResolvedValue(row({ id: 2, email: 'x@y.zz' }));
    await expect(service.findById(2, admin)).resolves.toMatchObject({ id: 2 });
  });

  it('serves a cache hit without touching the database', async () => {
    cache.getJson.mockResolvedValue({ id: 1, email: 'a@b.cd', role: 'user' });
    await expect(service.findById(1, owner)).resolves.toMatchObject({ id: 1 });
    expect(user.findUnique).not.toHaveBeenCalled();
  });

  it('fills the cache on a miss (read-through)', async () => {
    user.findUnique.mockResolvedValue(row());
    await service.findById(1, owner);
    expect(cache.setJson).toHaveBeenCalledWith('cache:users:1', expect.objectContaining({ id: 1 }));
  });

  it('invalidates the per-user cache key', async () => {
    await service.invalidateCachedUser(1);
    expect(cache.del).toHaveBeenCalledWith('cache:users:1');
  });

  it('lists with the whitelisted sort mapped to a literal orderBy', async () => {
    user.findMany.mockResolvedValue([row()]);
    user.count.mockResolvedValue(1);
    const query = { page: 1, limit: 20, skip: 0, sortBy: 'email', sortDir: 'ASC' };
    const result = await service.list(query as ListUsersQueryDto);
    expect(user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { email: 'asc' },
        skip: 0,
        take: 20,
        omit: { passwordHash: true },
      }),
    );
    expect(result.meta).toMatchObject({ totalItems: 1, page: 1, limit: 20 });
  });
});
