import { MemoryCacheAdapter } from '../index.js';
import type { CacheAdapter, CacheEntry } from '../index.js';

export interface InvalidationMessage {
  type: 'evict' | 'clear';
  key?: string;
}

export interface InvalidationBus {
  publish(message: InvalidationMessage): Promise<void> | void;
  subscribe(
    handler: (message: InvalidationMessage) => void,
  ): (() => Promise<void> | void) | undefined;
}

export interface TieredCacheAdapterOptions {
  /** In-process tier. Defaults to a fresh `MemoryCacheAdapter`. */
  local?: CacheAdapter;
  /** Broadcasts evictions between instances. Strongly recommended. */
  bus?: InvalidationBus | undefined;
  /**
   * Seconds a local copy may be trusted without confirmation from the shared
   * store. Bounds staleness when no bus is configured. Defaults to 5.
   */
  localTtl?: number;
  clock?: () => number;
}

/**
 * Puts an in-process memory tier in front of a shared store so a cache hit does
 * not cost a network round trip, while the shared store stays the source of
 * truth for tags and paths.
 *
 * The local tier is what makes distributed invalidation non-trivial: deleting an
 * entry in Redis does not evict the copy another pod already has in memory. The
 * optional bus closes that gap by broadcasting evictions between instances.
 * Without a bus, the local tier is still correct for a single instance, but a
 * remote `revalidateTag` will not be reflected locally until the entry expires,
 * so `localTtl` bounds how long that window can be.
 */
class TieredCacheAdapter implements CacheAdapter {
  shared: CacheAdapter;
  local: CacheAdapter;
  bus: InvalidationBus | undefined;
  localTtl: number;
  clock: () => number;
  localWrites: Map<string, number>;
  unsubscribe: (() => Promise<void> | void) | undefined;

  constructor(
    shared: CacheAdapter,
    {
      local = new MemoryCacheAdapter(),
      bus,
      localTtl = 5,
      clock = Date.now,
    }: TieredCacheAdapterOptions = {},
  ) {
    if (!shared)
      throw new TypeError('TieredCacheAdapter requires a shared adapter.');
    this.shared = shared;
    this.local = local;
    this.bus = bus;
    this.localTtl = localTtl;
    this.clock = clock;
    this.localWrites = new Map();
    this.unsubscribe = bus?.subscribe(message => {
      void this.#applyRemote(message);
    });

    // NessCache decides whether an index exists by probing for these methods.
    // A class always carries them on its prototype, so wrapping an adapter
    // that has no tag index would advertise one that returns nothing — turning
    // revalidateTag into a silent no-op instead of falling back to a scan.
    // Shadow them with own properties when the shared adapter cannot back them.
    const self = this as {
      keysByTag?: CacheAdapter['keysByTag'];
      keysByPath?: CacheAdapter['keysByPath'];
    };
    if (typeof shared.keysByTag !== 'function') self.keysByTag = undefined;
    if (typeof shared.keysByPath !== 'function') self.keysByPath = undefined;
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    const cached = await this.local.get(key);
    if (cached && this.#localIsUsable(key)) return cached;
    if (cached) await this.local.delete(key);
    const entry = await this.shared.get(key);
    if (entry) await this.#writeLocal(key, entry);
    return entry;
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    await this.shared.set(key, entry);
    await this.#writeLocal(key, entry);
    await this.#publish({ type: 'evict', key });
  }

  async delete(key: string): Promise<void> {
    await this.shared.delete(key);
    await this.#evictLocal(key);
    await this.#publish({ type: 'evict', key });
  }

  async keys(): Promise<string[]> {
    return this.shared.keys();
  }

  async clear(): Promise<void> {
    await this.shared.clear();
    await this.local.clear();
    this.localWrites.clear();
    await this.#publish({ type: 'clear' });
  }

  async keysByTag(tag: string): Promise<string[]> {
    return this.shared.keysByTag?.(tag) ?? [];
  }

  async keysByPath(pathname: string): Promise<string[]> {
    return this.shared.keysByPath?.(pathname) ?? [];
  }

  async close(): Promise<void> {
    await this.unsubscribe?.();
  }

  #localIsUsable(key: string): boolean {
    if (!Number.isFinite(this.localTtl)) return true;
    const writtenAt = this.localWrites.get(key);
    if (writtenAt === undefined) return false;
    return (this.clock() - writtenAt) / 1000 < this.localTtl;
  }

  async #writeLocal(key: string, entry: CacheEntry): Promise<void> {
    await this.local.set(key, entry);
    this.localWrites.set(key, this.clock());
  }

  async #evictLocal(key: string): Promise<void> {
    await this.local.delete(key);
    this.localWrites.delete(key);
  }

  async #publish(message: InvalidationMessage): Promise<void> {
    if (!this.bus) return;
    await this.bus.publish(message);
  }

  /** Applied without re-publishing, so a broadcast cannot loop between peers. */
  async #applyRemote(message: InvalidationMessage): Promise<void> {
    if (!message) return;
    if (message.type === 'clear') {
      await this.local.clear();
      this.localWrites.clear();
      return;
    }
    if (message.type === 'evict' && message.key) {
      await this.#evictLocal(message.key);
    }
  }
}

/** Just enough of a Redis connection to publish and subscribe on a channel. */
type PubSubClient = Record<string, unknown>;

type BoundCommand = (...args: unknown[]) => unknown;

function bindCommand(
  client: PubSubClient,
  ...names: string[]
): BoundCommand | undefined {
  const name = names.find(candidate => typeof client[candidate] === 'function');
  return name ? (client[name] as BoundCommand).bind(client) : undefined;
}

/**
 * Bridges TieredCacheAdapter to Redis pub/sub. `subscriber` must be a
 * connection dedicated to subscribing — Redis forbids other commands on it.
 */
function createRedisInvalidationBus(
  publisher: unknown,
  subscriber: unknown,
  {
    channel = 'ness:cache:invalidate',
    id = `${process.pid}:${Math.random()}`,
  }: { channel?: string; id?: string } = {},
): InvalidationBus {
  const publisherClient = publisher as PubSubClient;
  const subscriberClient = subscriber as PubSubClient;
  const publish = bindCommand(publisherClient, 'publish', 'PUBLISH');
  const subscribeTo = bindCommand(subscriberClient, 'subscribe', 'SUBSCRIBE');
  if (!publish || !subscribeTo) {
    throw new TypeError(
      'createRedisInvalidationBus requires clients exposing publish() and subscribe().',
    );
  }

  return {
    async publish(message: InvalidationMessage): Promise<void> {
      await publish(channel, JSON.stringify({ ...message, id }));
    },
    subscribe(handler: (message: InvalidationMessage) => void) {
      const receive = (payload: unknown) => {
        if (typeof payload !== 'string') return;
        let message: (InvalidationMessage & { id?: string }) | undefined;
        try {
          message = JSON.parse(payload);
        } catch {
          return;
        }
        // Ignore our own broadcast; the local tier is already consistent.
        if (!message || message.id === id) return;
        handler(message);
      };

      // The two clients disagree about the second argument to subscribe():
      // node-redis takes a message listener, ioredis takes a node-style
      // completion callback and emits 'message' events instead. Passing a
      // listener to ioredis gets it invoked once as (err, count).
      // pSubscribe exists only on node-redis, which is what distinguishes them
      // — both return a promise and both are EventEmitters, so neither of those
      // tells them apart.
      const isNodeRedis = typeof subscriberClient['pSubscribe'] === 'function';
      if (isNodeRedis) {
        subscribeTo(channel, receive);
      } else {
        subscribeTo(channel);
        const on = bindCommand(subscriberClient, 'on');
        on?.('message', (incoming: unknown, payload: unknown) => {
          if (incoming === channel) receive(payload);
        });
      }

      return async () => {
        const unsubscribe = bindCommand(subscriberClient, 'unsubscribe');
        await unsubscribe?.(channel);
      };
    },
  };
}

export { TieredCacheAdapter, createRedisInvalidationBus };
export default TieredCacheAdapter;
