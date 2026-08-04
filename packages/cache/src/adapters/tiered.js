import { MemoryCacheAdapter } from '../index.js';

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
class TieredCacheAdapter {
  constructor(
    shared,
    {
      local = new MemoryCacheAdapter(),
      bus,
      localTtl = 5,
      clock = Date.now,
    } = {},
  ) {
    if (!shared)
      throw new TypeError('TieredCacheAdapter requires a shared adapter.');
    this.shared = shared;
    this.local = local;
    this.bus = bus;
    this.localTtl = localTtl;
    this.clock = clock;
    this.localWrites = new Map();
    this.unsubscribe = bus?.subscribe(message => this.#applyRemote(message));
  }

  async get(key) {
    const cached = await this.local.get(key);
    if (cached && this.#localIsUsable(key)) return cached;
    if (cached) await this.local.delete(key);
    const entry = await this.shared.get(key);
    if (entry) await this.#writeLocal(key, entry);
    return entry;
  }

  async set(key, entry) {
    await this.shared.set(key, entry);
    await this.#writeLocal(key, entry);
    await this.#publish({ type: 'evict', key });
  }

  async delete(key) {
    await this.shared.delete(key);
    await this.#evictLocal(key);
    await this.#publish({ type: 'evict', key });
  }

  async keys() {
    return this.shared.keys();
  }

  async clear() {
    await this.shared.clear();
    await this.local.clear();
    this.localWrites.clear();
    await this.#publish({ type: 'clear' });
  }

  async keysByTag(tag) {
    return this.shared.keysByTag?.(tag) ?? [];
  }

  async keysByPath(pathname) {
    return this.shared.keysByPath?.(pathname) ?? [];
  }

  async close() {
    await this.unsubscribe?.();
  }

  #localIsUsable(key) {
    if (!Number.isFinite(this.localTtl)) return true;
    const writtenAt = this.localWrites.get(key);
    if (writtenAt === undefined) return false;
    return (this.clock() - writtenAt) / 1000 < this.localTtl;
  }

  async #writeLocal(key, entry) {
    await this.local.set(key, entry);
    this.localWrites.set(key, this.clock());
  }

  async #evictLocal(key) {
    await this.local.delete(key);
    this.localWrites.delete(key);
  }

  async #publish(message) {
    if (!this.bus) return;
    await this.bus.publish(message);
  }

  /** Applied without re-publishing, so a broadcast cannot loop between peers. */
  async #applyRemote(message) {
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

/**
 * Bridges TieredCacheAdapter to Redis pub/sub. `subscriber` must be a
 * connection dedicated to subscribing — Redis forbids other commands on it.
 */
function createRedisInvalidationBus(
  publisher,
  subscriber,
  {
    channel = 'ness:cache:invalidate',
    id = `${process.pid}:${Math.random()}`,
  } = {},
) {
  const publish = (publisher.publish || publisher.PUBLISH)?.bind(publisher);
  const subscribeTo = (subscriber.subscribe || subscriber.SUBSCRIBE)?.bind(
    subscriber,
  );
  if (!publish || !subscribeTo) {
    throw new TypeError(
      'createRedisInvalidationBus requires clients exposing publish() and subscribe().',
    );
  }

  return {
    async publish(message) {
      await publish(channel, JSON.stringify({ ...message, id }));
    },
    subscribe(handler) {
      const receive = payload => {
        let message;
        try {
          message = JSON.parse(payload);
        } catch {
          return;
        }
        // Ignore our own broadcast; the local tier is already consistent.
        if (message.id === id) return;
        handler(message);
      };
      // node-redis takes the listener as the second argument; ioredis emits
      // a 'message' event instead.
      const result = subscribeTo(channel, receive);
      if (typeof subscriber.on === 'function' && result?.then) {
        subscriber.on('message', (incoming, payload) => {
          if (incoming === channel) receive(payload);
        });
      }
      return async () => {
        await subscriber.unsubscribe?.(channel);
      };
    },
  };
}

export { TieredCacheAdapter, createRedisInvalidationBus };
export default TieredCacheAdapter;
