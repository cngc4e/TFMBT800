import * as app from "app";
import { messageReceiver } from "connection/remote";
import { DynamicModule, DynamicModuleError } from "DynamicModule";
import EventRegistry from "registry/EventRegistry";
import { ByteArray } from "utils/byteArray";

var msgrecv: EventRegistry;

/**
 * Handles remote communication
 */
export default new DynamicModule({
    name: "Bt800Remote",

    async init() {
        msgrecv = new EventRegistry(messageReceiver);
        return DynamicModuleError.OK;
    },

    async load() {
        // Exposes endpoints

        // Request whisper
        msgrecv.on("request/whisper", (content) => {
            try {
                const packet = new ByteArray(Buffer.from(content));

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
        msgrecv.removeAllListeners();
        return DynamicModuleError.OK;
    }
});
