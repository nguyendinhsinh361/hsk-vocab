import { CacheStore } from './cache-store.interface';
import { InMemoryCacheStore } from './in-memory.store';
import { RedisCacheStore, RedisLike } from './redis.store';

/** Map-backed ioredis fake honoring EX expiry — same clock the memory store uses. */
function redisFake(): RedisLike {
  const entries = new Map<string, { value: string; expiresAt: number }>();
  const live = (key: string): boolean => {
    const entry = entries.get(key);
    if (entry === undefined) return false;
    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return false;
    }
    return true;
  };
  return {
    ping: () => Promise.resolve('PONG'),
    get: (key) => Promise.resolve(live(key) ? (entries.get(key)?.value ?? null) : null),
    set: (key, value, _ex, seconds) => {
      entries.set(key, { value, expiresAt: Date.now() + seconds * 1_000 });
      return Promise.resolve('OK');
    },
    del: (...keys) => {
      let deleted = 0;
      for (const key of keys) if (entries.delete(key)) deleted += 1;
      return Promise.resolve(deleted);
    },
    scan: (_cursor, _match, pattern) => {
      const prefix = pattern.replace(/\*$/, '');
      return Promise.resolve<[string, string[]]>([
        '0',
        [...entries.keys()].filter((k) => k.startsWith(prefix) && live(k)),
      ]);
    },
    quit: () => Promise.resolve('OK'),
  };
}

const implementations: [name: string, create: () => CacheStore][] = [
  ['InMemoryCacheStore', () => new InMemoryCacheStore()],
  ['RedisCacheStore', () => new RedisCacheStore(redisFake())],
];

/**
 * ONE spec, every implementation (LSP): any store bound to CACHE_STORE must
 * pass these unchanged. A new backend (memcached, …) joins the table above —
 * if it needs different assertions, it does not satisfy the contract.
 */
describe.each(implementations)('%s — CacheStore contract', (_name, createStore) => {
  let store: CacheStore;

  beforeEach(() => {
    jest.useFakeTimers(); // modern timers fake Date.now → deterministic expiry
    store = createStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('misses on an unknown key', async () => {
    await expect(store.get('nope')).resolves.toBeNull();
  });

  it('round-trips a value', async () => {
    await store.set('k', 'v', 60);
    await expect(store.get('k')).resolves.toBe('v');
  });

  it('overwrites on repeated set', async () => {
    await store.set('k', 'v1', 60);
    await store.set('k', 'v2', 60);
    await expect(store.get('k')).resolves.toBe('v2');
  });

  it('expires entries after their TTL', async () => {
    await store.set('k', 'v', 60);
    jest.advanceTimersByTime(59_000);
    await expect(store.get('k')).resolves.toBe('v');
    jest.advanceTimersByTime(2_000);
    await expect(store.get('k')).resolves.toBeNull();
  });

  it('del removes exactly the given key', async () => {
    await store.set('a', '1', 60);
    await store.set('b', '2', 60);
    await store.del('a');
    await expect(store.get('a')).resolves.toBeNull();
    await expect(store.get('b')).resolves.toBe('2');
  });

  it('delByPrefix deletes only matching keys and reports the count', async () => {
    await store.set('cache:users:1', 'u1', 60);
    await store.set('cache:users:2', 'u2', 60);
    await store.set('cache:orders:1', 'o1', 60);
    await expect(store.delByPrefix('cache:users:')).resolves.toBe(2);
    await expect(store.get('cache:users:1')).resolves.toBeNull();
    await expect(store.get('cache:orders:1')).resolves.toBe('o1');
  });

  it('ping resolves while the backend is reachable', async () => {
    await expect(store.ping()).resolves.toBeUndefined();
  });
});
