// Initialize the core module
import * as app from "./app";
import { loadModules } from "./ModuleLoader";
import { remote } from "connection/remote";

const MAX_RETRIES = 15;

async function tryConnect(retries: number = 0) {
    app.info(retries == 0 ? "Starting..." : "Retrying...");

    var delay = Math.min(retries * 100);
    await new Promise((r) => setTimeout(r, delay));
    try {
        await app.client.run();
    } catch (err) {
        app.error(`Client failed to connect! (${retries})`);
        if (retries >= MAX_RETRIES) {
            throw `Exceeded max retries, exiting...`;
        }
        await tryConnect(retries + 1);
    }
}

function setupError() {
    app.client.on("connectionError", (err) => {
        app.error("Connection err", err);
        process.exit(1);
    });

    app.client.on("bulleConnectionError", (err) => {
        app.error("Bulle connection err", err);
        process.exit(1);
    });
}

async function start() {
    if (process.env.REDIS_URL) {
        await remote.connect(process.env.REDIS_URL);
        app.info("Connected to Redis");
    }

    await loadModules();
    setupError();
    await tryConnect();
}

process.nextTick(start);
