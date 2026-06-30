import { CacheStore } from './cache-store.interface';

interface Entry {
  value: string;
  expiresAt: number; // epoch ms
}

/**
 * Map + expiry timestamps: the zero-infrastructure default for dev and test.
 * Expired entries are dropped lazily on read — fine for the small, short-TTL
 * keyspaces this driver is meant for. Not shared across instances and not
 * persistent: switch CACHE_DRIVER=redis for anything multi-instance.
 */
export class InMemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, Entry>();

  get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (entry === undefined) return Promise.resolve(null);
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key); // lazy expiry
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.value);
  }

  set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }

  delByPrefix(prefix: string): Promise<number> {
    let deleted = 0;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
        deleted += 1;
      }
    }
    return Promise.resolve(deleted);
  }

  /** No external dependency — always reachable (and excluded from readiness). */
  ping(): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    this.entries.clear();
    return Promise.resolve();
  }
}
