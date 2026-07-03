import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_EMAIL } from '../common/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve userId: nếu có VÀ tồn tại trong DB → giữ nguyên.
   * Nếu rỗng, hoặc id không còn tồn tại (vd seed lại đổi id / localStorage cũ)
   * → fallback về demo user theo email. Tránh lỗi khoá ngoại userId.
   */
  async resolveUserId(userId: string): Promise<string> {
    if (userId) {
      const found = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (found) return found.id;
    }
    const demo = await this.prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
      select: { id: true },
    });
    if (!demo) throw new NotFoundException('Demo user chưa được seed');
    return demo.id;
  }

  async getProfile(userId: string) {
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
