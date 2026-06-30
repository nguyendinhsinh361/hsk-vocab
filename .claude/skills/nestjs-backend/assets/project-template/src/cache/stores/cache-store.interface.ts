export const CACHE_STORE = Symbol('CACHE_STORE');

/**
 * The narrow contract every cache backend must honor (LSP): stores are fully
 * substitutable, and cache-store.contract.spec.ts runs the SAME spec against
 * each implementation to prove it. Values are opaque strings — JSON
 * (de)serialization is CacheService's job; expiry is the store's.
 */
export interface CacheStore {
  /** null = miss. Missing and expired are indistinguishable to callers. */
  get(key: string): Promise<string | null>;
  /** Every entry has a TTL — an entry that cannot expire is a bug. */
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Returns the number of deleted entries. */
  delByPrefix(prefix: string): Promise<number>;
  /** Resolves when the backend is reachable; rejects otherwise (readiness). */
  ping(): Promise<void>;
  /** Graceful shutdown, invoked by CacheModule on application shutdown. */
  disconnect(): Promise<void>;
}
