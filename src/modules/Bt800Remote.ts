import { ByteArray } from "@cheeseformice/transformice.js";
import BaseLib from "BaseLib";
import { DynamicModule, DynamicModuleError } from "DynamicModule";
import RedisRegistry from "registry/RedisRegistry";

/**
 * Handles remote communication
 */
export default class Bt800Remote extends DynamicModule {
    private redisReg: RedisRegistry;
    constructor(base: BaseLib) {
        super(base);
        this.redisReg = new RedisRegistry();
    }

    load() {
        var client = this.base.client;
        var redisReg = this.redisReg;

        // Exposes endpoints

        // Request whisper
        redisReg.sub("tfm/external/whisper", (data) => {
            try {
                const packet = new ByteArray(Buffer.from(data));

                var name = packet.readUTF();
                var message = packet.readUTF();
                client.sendWhisper(name, message);
            } catch (e) {
                console.error("Error or malformed packet:", e);
            }
        });

        return DynamicModuleError.OK;
    }

    unload() {
        this.redisReg.unsubAllListeners();
        return DynamicModuleError.OK;
    }
}
