import { subscribeChannel, unsubscribeChannel } from "connection/RedisBroker";
import { PubSubListener } from "redis/dist/lib/client/commands-queue";

/**
 * Keeps track of Redis Pub/Sub listeners and automatically removes them upon selected events.
 */
class RedisRegistry {
    private tracked: {
        channel: string,
        listener: PubSubListener
    }[] = [];

    async sub(...args: Parameters<typeof subscribeChannel>) {
        var channels = args[0] as string | string[];
        var listener = args[1] as PubSubListener;

        if (Array.isArray(channels)) {
            for (let i = 0; i < channels.length; i++) {
                this.tracked.push({ channel: channels[i], listener: listener });
            }
        } else {
            this.tracked.push({ channel: channels, listener: listener });
        }

        return await subscribeChannel(channels, listener);
    }

    async unsubAllListeners() {
        let promises: Promise<unknown>[] = [];
        for (let i = 0; i < this.tracked.length; i++) {
            let t = this.tracked[i];
            promises.push(unsubscribeChannel(t.channel, t.listener));
        }
        await Promise.all(promises);
    }
}

export default RedisRegistry;
