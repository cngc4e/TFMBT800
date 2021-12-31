// Initialize the core module
import * as app from "./app";
import { loadModules } from "./ModuleLoader";
import { remote } from "connection/remote";
import { EventWaiter } from "utils/events";

const MAX_RETRIES = 15;

class ConnectError {
    constructor(public message: string = "unknown", public shouldExit: boolean = false) { }

    static isConnectError(obj: any): obj is ConnectError {
        return obj instanceof ConnectError;
    }
}

async function connect() {
    try {
        await app.client.run();
    } catch (e) {
        throw new ConnectError(e.toString());
    }
    const errorCatchers = () => {
        return new Promise((resolve, reject) => {
            let connectionListener =
                (err: Error) => {
                    app.client.removeListener("loginError", loginListener);
                    reject(new ConnectError("Connection error: " + err.toString(), true));
                },
                loginListener = (code: number) => {
                    app.client.removeListener("connectionError", connectionListener);
                    switch (code) {
                        case 1: // Already connected
                            reject(new ConnectError("Already connected"));
                            break;
                        case 2: // Incorrect password
                            reject(new ConnectError("Incorrect password", true));
                            break;
                        default:
                            reject(new ConnectError("Unknown error: " + code));
                            break;
                    }
                }
            app.client.once("connectionError", connectionListener);
            app.client.once("loginError", loginListener);
            app.client.once("connect", () => {
                app.client.removeListener("connectionError", connectionListener);
                app.client.removeListener("loginError", loginListener);
                resolve(true);
            });
        });
    }

    try {
        await errorCatchers();
    } catch (e) {
        throw e;
    }
}

async function tryConnect(retries: number = 0) {
    app.info(retries === 0 ? "Starting..." : "Retrying...");

    var delay = Math.min(retries * 1000, 10000);
    await new Promise((r) => setTimeout(r, delay));
    try {
        await connect();
    } catch (err) {
        if (!ConnectError.isConnectError(err) || err.shouldExit) {
            process.exit(1);
        }
        app.error(`Client failed to connect! (${retries}): ${err.message}`);
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
        // TODO: Setup a timer to check if we have a working connection after some time?
    });
}

async function start() {
    if (process.env.REDIS_URL) {
        await remote.connect(process.env.REDIS_URL);
        app.info("Connected to Redis");
    }

    await loadModules();
    await tryConnect();
    setupError();
}

process.nextTick(start);
