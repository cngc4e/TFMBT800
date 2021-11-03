import { ByteArray } from "@cheeseformice/transformice.js";
import { subscribeChannel, unsubscribeChannel } from "connection/RedisBroker";
import { DynamicModule, DynamicModuleError } from "DynamicModule";

/**
 * Handles remote communication
 */
export default class Bt800Remote extends DynamicModule {
    load() {
        var client = this.base.client;

        // Exposes endpoints

        // Request whisper
        subscribeChannel("tfm/external/whisper", (data) => {
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
        unsubscribeChannel("tfm/whisper");
        return DynamicModuleError.OK;
    }
}
