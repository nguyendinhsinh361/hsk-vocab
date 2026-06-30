import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HskLevel } from '@prisma/client';
import { isFakeData } from '../fake/fake.util';
import { fakeDeckSummaries, fakeDeckCards, fakeWordTree } from '../fake/fixtures';

@Injectable()
export class DecksService {
  constructor(private prisma: PrismaService) {}

  findAll(level?: HskLevel) {
    if (isFakeData()) return fakeDeckSummaries(level);
    return this.prisma.deck.findMany({
      where: level ? { level } : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        _count: { select: { cards: true } },
      },
      orderBy: [{ level: 'asc' }, { position: 'asc' }],
    });
  }

  async findCards(deckId: string) {
    if (isFakeData()) {
      const cards = fakeDeckCards(deckId);
      if (cards.length === 0) throw new NotFoundException('Deck not found');
      return cards;
    }
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
    if (!deck) throw new NotFoundException('Deck not found');
    return deck.cards;
  }

  /** Cây từ: gốc + các từ ghép con (dùng cho màn "cây từ gốc"). */
  async wordTree(deckId: string) {
    if (isFakeData()) {
      const tree = fakeWordTree(deckId);
      if (tree.length === 0) throw new NotFoundException('Deck rỗng hoặc không tồn tại');
      return tree;
    }
    const roots = await this.prisma.card.findMany({
      where: { deckId, parentId: null },
      orderBy: { position: 'asc' },
      include: { children: { orderBy: { position: 'asc' } } },
    });
    if (roots.length === 0) throw new NotFoundException('Deck rỗng hoặc không tồn tại');
    return roots;
  }
}
