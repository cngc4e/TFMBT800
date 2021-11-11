
import { logger } from 'app';
import { createClient } from 'redis';

const MODULE_NAME = "[RedisBroker]";

var pendingInit: true | null = true;
var subClient: ReturnType<typeof createClient>;
var pubClient: ReturnType<typeof createClient>;

export async function subscribeChannel(...args: Parameters<typeof subClient.subscribe>) {
    if (pendingInit) throw MODULE_NAME + " Cannot subscribe before init!";
    return await subClient.subscribe(...args);
}

export async function unsubscribeChannel(...args: Parameters<typeof subClient.unsubscribe>) {
    if (pendingInit) throw MODULE_NAME + " Cannot unsubscribe before init!";
    return await subClient.unsubscribe(...args);
}

export async function publishChannel(...args: Parameters<typeof pubClient.publish>) {
    if (pendingInit) throw MODULE_NAME + " Cannot publish before init!";
    return await pubClient.publish(...args);
}

export function isReady() {
    return !pendingInit;
}

/**
 * Creates the Redis sub/pub. Throws an error if failed.
 */
export async function initRedis(url: string) {
    var client = createClient({ url });

    subClient = client as typeof subClient;
    pubClient = subClient.duplicate();

    await Promise.all([subClient.connect(), pubClient.connect()]);
    logger.debug("RedisBroker connected.");

    pendingInit = null;
}
