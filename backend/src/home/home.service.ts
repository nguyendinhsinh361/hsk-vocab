import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import type { HomeData, RootMini, TopicGroup } from './home.types';

// Đổi version (vN) mỗi khi thay đổi cấu trúc catalog để BỎ cache cũ (tránh stale).
const CATALOG_KEY = 'home:catalog:HSK1:v2';
const CATALOG_TTL = 60 * 60; // nội dung tĩnh — cache 1h
const LEVEL = 'HSK1';

/** Đọc field JSON đa ngữ { vi, en } → chuỗi vi. */
function vi(json: unknown, fallback = ''): string {
  if (!json) return fallback;
  if (typeof json === 'string') return json;
  return (json as { vi?: string }).vi ?? fallback;
}

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
  ) {}

  async getHome(userId: string): Promise<HomeData> {
    const [catalog, user] = await Promise.all([
      this.getCatalog(),
      this.getUserSummary(userId),
    ]);

    const active = catalog.topicGroups[0] ?? null;
    let continueLearning: HomeData['continueLearning'] = null;
    if (active?.startRootId) {
      const root =
        catalog.popularRoots.find((r) => r.id === active.startRootId) ??
        (await this.rootMini(active.startRootId));
      if (root) continueLearning = { topicTitle: active.title, root };
    }

    return {
      user: {
        name: user.name,
        level: user.level,
        learnedRoots: user.learnedRoots,
        totalRoots: catalog.totalRoots,
      },
      continueLearning,
      topicGroups: catalog.topicGroups.map((t, i) => ({ ...t, active: i === 0 })),
      popularRoots: catalog.popularRoots,
    };
  }

  /** Catalog (topic groups + popular roots) — cache-aside Redis. */
  private async getCatalog(): Promise<Catalog> {
    const cached = await this.redis.getJson<Catalog>(CATALOG_KEY);
    if (cached) return cached;

    const p = this.prisma as any;
    const topics = await p.topic.findMany({
      where: { hskLevel: LEVEL },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { roots: true } },
        roots: { take: 1, orderBy: { id: 'asc' }, select: { id: true } },
      },
    });

    const topicGroups: TopicGroup[] = topics
      .filter((t: any) => t._count.roots > 0)
      .map((t: any) => ({
        id: t.id,
        title: vi(t.title, t.id),
        rootCount: t._count.roots,
        startRootId: t.roots[0]?.id ?? null,
        active: false,
      }));

    const roots = await p.root.findMany({
      where: { hskLevel: LEVEL },
      orderBy: { id: 'asc' },
      take: 12,
      select: { id: true, hz: true, py: true, hv: true },
    });
    const popularRoots: RootMini[] = roots.map((r: any) => ({
      id: r.id,
      hz: r.hz,
      py: r.py,
      hv: cap(r.hv),
    }));

    const totalRoots = await p.root.count({ where: { hskLevel: LEVEL } });

    const catalog: Catalog = { topicGroups, popularRoots, totalRoots };
    await this.redis.setJson(CATALOG_KEY, catalog, CATALOG_TTL);
    return catalog;
  }

  private async getUserSummary(userId: string) {
    const id = await this.users.resolveUserId(userId);
    const p = this.prisma as any;
    const user = await p.user.findUnique({
      where: { id },
      select: { name: true, level: true },
    });
    // learnedRoots: số gốc DISTINCT user đã chạm tới (qua tiến độ từ → WordRoot).
    const progresses = await p.userWordProgress.findMany({
      where: { userId: id },
      select: { word: { select: { roots: { select: { rootId: true } } } } },
    });
    const rootSet = new Set<string>();
    for (const pg of progresses)
      for (const wr of pg.word?.roots ?? []) rootSet.add(wr.rootId);
    const learnedRoots = rootSet.size;
    return {
      name: user?.name ?? 'Bạn học HSK',
      level: user?.level ?? 1,
      learnedRoots,
    };
  }

  private async rootMini(rootId: string): Promise<RootMini | null> {
    const p = this.prisma as any;
    const r = await p.root.findUnique({
      where: { id: rootId },
      select: { id: true, hz: true, py: true, hv: true },
    });
    return r ? { id: r.id, hz: r.hz, py: r.py, hv: cap(r.hv) } : null;
  }
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
