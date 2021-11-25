import ClientEvents from "@cheeseformice/transformice.js/dist/client/Events";
import * as app from "app";
import { InfraConnectionMessageReceiverEvents, messageReceiver, remote } from "connection/remote";
import { DynamicModule, DynamicModuleError } from "DynamicModule";
import EventRegistry from "registry/EventRegistry";
import { ByteArray } from "utils/byteArray";
import { EventWaiter } from "utils/events";

var msgrecv: EventRegistry<InfraConnectionMessageReceiverEvents>;

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
        msgrecv.on("request/whisper", async (content, connMsg) => {
            try {
                const packet = new ByteArray(Buffer.from(content));

                var name = packet.readUTF();
                var message = packet.readUTF();
                app.client.sendWhisper(name, message);

                try {
                    let [message] = await (new EventWaiter<ClientEvents>(app.client)).waitFor("whisper", {
                        condition: (message) => message.sentTo.name.toLowerCase().includes(name.toLowerCase()),
                        timeout: 5000
                    });
                    let packet = new ByteArray();
                    packet.writeUTF(message.sentTo.name).writeUTF(message.content);
                    await remote.sendMessage(connMsg.sender, "reply/whisper", packet.buffer);
                } catch (e) {}

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
