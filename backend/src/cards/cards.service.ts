import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isFakeData } from '../fake/fake.util';
import { fakeCard } from '../fake/fixtures';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    if (isFakeData()) {
      const card = fakeCard(id);
      if (!card) throw new NotFoundException('Card not found');
      return card;
    }
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { children: { orderBy: { position: 'asc' } } },
    });
    if (!card) throw new NotFoundException('Card not found');
    return card;
  }
}
