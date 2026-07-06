import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { ReviewRepository } from '../review/review.repository';
import { vi } from '../common/i18n-json.util';
import { cap } from '../common/string.util';
import type { HomeData, RootMini, TopicGroup } from './home.types';

// Đổi version (vN) mỗi khi thay đổi cấu trúc catalog để BỎ cache cũ (tránh stale).
const CATALOG_KEY = 'home:catalog:HSK1:v2';
const CATALOG_TTL = 60 * 60; // nội dung tĩnh — cache 1h
const LEVEL = 'HSK1';

interface Catalog {
  topicGroups: TopicGroup[];
  popularRoots: RootMini[];
  totalRoots: number;
}

@Injectable()
export class HomeService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private users: UsersService,
    private reviews: ReviewRepository,
  ) {}

  async getHome(userId: string): Promise<HomeData> {
    // Resolve 1 lần rồi dùng lại (getUserSummary + resolveContinue đều cần id thật).
    const resolvedId = await this.users.resolveUserId(userId);
    const [catalog, user] = await Promise.all([
      this.getCatalog(),
      this.getUserSummary(resolvedId),
    ]);

    // "Học tiếp" ĐI THEO USER (per-user, không cache).
    const continueLearning = await this.resolveContinue(
      resolvedId,
      catalog,
      user.learnedWords,
    );

    return {
      user: {
        name: user.name,
        level: user.level,
        learnedRoots: user.learnedRoots,
        totalRoots: catalog.totalRoots,
        reviewDue: user.reviewDue,
      },
      continueLearning,
      topicGroups: catalog.topicGroups.map((t, i) => ({
        ...t,
        active: i === 0,
      })),
      popularRoots: catalog.popularRoots,
    };
  }

  /** Catalog (topic groups + popular roots) — cache-aside Redis. */
  private async getCatalog(): Promise<Catalog> {
    const cached = await this.redis.getJson<Catalog>(CATALOG_KEY);
    if (cached) return cached;

    const topics = await this.prisma.topic.findMany({
      where: { hskLevel: LEVEL },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { roots: true } },
        roots: { take: 1, orderBy: { id: 'asc' }, select: { id: true } },
      },
    });

    const topicGroups: TopicGroup[] = topics
      .filter((t) => t._count.roots > 0)
      .map((t) => ({
        id: t.id,
        title: vi(t.title, t.id),
        rootCount: t._count.roots,
        startRootId: t.roots[0]?.id ?? null,
        active: false,
      }));

    const roots = await this.prisma.root.findMany({
      where: { hskLevel: LEVEL },
      orderBy: { id: 'asc' },
      take: 12,
      select: { id: true, hz: true, py: true, hv: true },
    });
    const popularRoots: RootMini[] = roots.map((r) => ({
      id: r.id,
      hz: r.hz,
      py: r.py,
      hv: cap(r.hv),
    }));

    const totalRoots = await this.prisma.root.count({
      where: { hskLevel: LEVEL },
    });

    const catalog: Catalog = { topicGroups, popularRoots, totalRoots };
    await this.redis.setJson(CATALOG_KEY, catalog, CATALOG_TTL);
    return catalog;
  }

  // id: đã resolve ở getHome (không resolve lại).
  private async getUserSummary(id: string) {
    const [user, progresses, reviewDue] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        select: { name: true, level: true },
      }),
      // Tiến độ từ: dùng cho learnedRoots (DISTINCT root) + learnedWords (thẻ Học tiếp).
      this.prisma.userWordProgress.findMany({
        where: { userId: id },
        select: {
          wordId: true,
          word: { select: { roots: { select: { rootId: true } } } },
        },
      }),
      // Degrade an toàn: DB chưa migrate cột review → coi như 0, không vỡ Home.
      this.reviews.countDue(id).catch(() => 0),
    ]);
    const learnedWords = new Set<string>();
    const rootSet = new Set<string>();
    for (const pg of progresses) {
      learnedWords.add(pg.wordId);
      for (const wr of pg.word.roots) rootSet.add(wr.rootId);
    }
    return {
      name: user?.name ?? 'Bạn học HSK',
      level: user?.level ?? 1,
      learnedRoots: rootSet.size,
      reviewDue,
      learnedWords,
    };
  }

  /**
   * Thẻ "Học tiếp" ĐI THEO USER (per-user, không cache):
   *   1) Gốc của PHIÊN LUYỆN GẦN NHẤT nếu còn từ chưa học (đang dở).
   *   2) Nếu không: gốc ĐẦU TIÊN (theo thứ tự chủ đề) chưa hoàn tất.
   *   3) Đã học hết: fallback về gốc đầu của chủ đề đầu.
   */
  private async resolveContinue(
    userId: string,
    catalog: Catalog,
    learnedWords: Set<string>,
  ): Promise<HomeData['continueLearning']> {
    // Gốc HSK1 theo thứ tự chủ đề, kèm từ (biết đã học hết chưa) + chủ đề (tên thẻ).
    const roots = await this.prisma.root.findMany({
      where: { hskLevel: LEVEL },
      orderBy: [{ topic: { order: 'asc' } }, { id: 'asc' }],
      select: {
        id: true,
        hz: true,
        py: true,
        hv: true,
        topic: { select: { id: true, title: true } },
        words: { select: { wordId: true } },
      },
    });
    type RootRow = (typeof roots)[number];
    // "Hoàn tất" = có từ và MỌI từ của gốc đều đã học.
    const done = (r: RootRow) =>
      r.words.length > 0 && r.words.every((w) => learnedWords.has(w.wordId));

    // (1) Phiên luyện gần nhất còn dở.
    const recent = await this.prisma.practiceSession.findFirst({
      where: { userId, rootId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { rootId: true },
    });
    if (recent?.rootId) {
      const r = roots.find((x) => x.id === recent.rootId);
      if (r && !done(r)) return this.toContinue(r, catalog);
    }

    // (2) Gốc đầu tiên chưa hoàn tất (đang dở hoặc chưa học).
    const next = roots.find((r) => !done(r));
    if (next) return this.toContinue(next, catalog);

    // (3) Đã học hết → gốc đầu của chủ đề đầu.
    const active = catalog.topicGroups[0];
    if (active?.startRootId) {
      const root =
        catalog.popularRoots.find((r) => r.id === active.startRootId) ??
        (await this.rootMini(active.startRootId));
      if (root) return { topicTitle: active.title, root };
    }
    return null;
  }

  private toContinue(
    r: {
      id: string;
      hz: string;
      py: string;
      hv: string;
      topic: { id: string; title: unknown } | null;
    },
    catalog: Catalog,
  ): HomeData['continueLearning'] {
    const topicTitle = r.topic
      ? vi(r.topic.title, r.topic.id)
      : (catalog.topicGroups[0]?.title ?? 'HSK1');
    return {
      topicTitle,
      root: { id: r.id, hz: r.hz, py: r.py, hv: cap(r.hv) },
    };
  }

  private async rootMini(rootId: string): Promise<RootMini | null> {
    const r = await this.prisma.root.findUnique({
      where: { id: rootId },
      select: { id: true, hz: true, py: true, hv: true },
    });
    return r ? { id: r.id, hz: r.hz, py: r.py, hv: cap(r.hv) } : null;
  }
}
