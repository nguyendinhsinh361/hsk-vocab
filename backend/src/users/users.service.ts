import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_EMAIL } from '../common/current-user.decorator';
import { isFakeData } from '../fake/fake.util';
import { FAKE_USER } from '../fake/fixtures';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Resolve userId: fake → demo-user; thật → giữ nguyên hoặc lấy demo theo email. */
  async resolveUserId(userId: string): Promise<string> {
    if (isFakeData()) return userId || FAKE_USER.id;
    if (userId) return userId;
    const demo = await this.prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
      select: { id: true },
    });
    if (!demo) throw new NotFoundException('Demo user chưa được seed');
    return demo.id;
  }

  async getProfile(userId: string) {
    if (isFakeData()) return FAKE_USER;
    const id = await this.resolveUserId(userId);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
