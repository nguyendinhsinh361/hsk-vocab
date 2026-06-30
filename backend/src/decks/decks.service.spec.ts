import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DecksService } from './decks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DecksService', () => {
  let service: DecksService;
  const prisma = {
    deck: { findMany: jest.fn(), findUnique: jest.fn() },
    card: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    process.env.USE_FAKE_DATA = 'false'; // test nhánh Prisma thật
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [DecksService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(DecksService);
  });

  it('findCards ném NotFound khi deck không tồn tại', async () => {
    prisma.deck.findUnique.mockResolvedValue(null);
    await expect(service.findCards('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findCards trả cards theo thứ tự position', async () => {
    const cards = [{ id: '1' }, { id: '2' }];
    prisma.deck.findUnique.mockResolvedValue({ id: 'd', cards });
    await expect(service.findCards('d')).resolves.toEqual(cards);
    expect(prisma.deck.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'd' } }),
    );
  });

  it('wordTree ném NotFound khi không có gốc từ', async () => {
    prisma.card.findMany.mockResolvedValue([]);
    await expect(service.wordTree('d')).rejects.toBeInstanceOf(NotFoundException);
  });
});
