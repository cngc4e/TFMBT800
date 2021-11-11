import { ByteArray } from "@cheeseformice/transformice.js";
import * as app from "app";
import { DynamicModule, DynamicModuleError } from "DynamicModule";
import RedisRegistry from "registry/RedisRegistry";

var redisReg: RedisRegistry;

/**
 * Handles remote communication
 */
export default new DynamicModule({
    name: "Bt800Remote",

    async init() {
        redisReg = new RedisRegistry();
        return DynamicModuleError.OK;
    },

    async load() {
        // Exposes endpoints

        // Request whisper
        redisReg.sub("tfm/external/whisper", (data) => {
            try {
                const packet = new ByteArray(Buffer.from(data));

                var name = packet.readUTF();
                var message = packet.readUTF();
                app.client.sendWhisper(name, message);
            } catch (e) {
                this.logger.error("Error or malformed packet:", e);
            }
        });

        return DynamicModuleError.OK;
    },

    async unload() {
        redisReg.unsubAllListeners();
        return DynamicModuleError.OK;
    }
});
