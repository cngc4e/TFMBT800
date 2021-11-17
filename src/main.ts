// Initialize the core module
import * as app from "./app";
import { loadModules } from "./ModuleLoader";

async function start() {
    if (process.env.REDIS_URL) {
        await initRedis(process.env.REDIS_URL);
    }

    await loadModules();

    app.info("Starting...");
    app.client.run();
}

process.nextTick(start);
