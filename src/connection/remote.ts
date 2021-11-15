import * as app from "app";
import { createClient } from "redis";
import { TypedEmitter } from "tiny-typed-emitter";
import { ByteArray } from "utils/byteArray";
import { multislug } from "utils/identifiers";

interface InfraConnectionEvents {
    /**
     * Message sent to this process.
     */
    messageReceived: (message: InfraConnectionMessage) => void;
    /**
     * Broadcast message received by this process.
     */
    broadcastReceived: (message: InfraConnectionBroadcast) => void;
    /**
     * Redis client error occurred.
     */
    clientError: (error: Error) => void;
}

export interface InfraConnectionMessage {
    /**
     * The process name of the sender.
     */
    sender: string;
    event: string;
    content: Buffer;
}

export interface InfraConnectionBroadcast {
    /**
     * The process name of the sender.
     */
    sender: string;
    channel: string;
    content: Buffer;
}

/**
 * Interface for inter-process communication.
 */
class InfraConnection extends TypedEmitter<InfraConnectionEvents> {
    /**
     * The main Redis SUB client.
     */
    private client!: ReturnType<typeof createClient>;
    /**
     * The Redis PUB client.
     */
    private pubClient!: ReturnType<typeof createClient>;
    /**
     * The process' cached Redis channel name.
     */
    private redisChannel: string;
    private logger: typeof app.logger;
    private connected: boolean;
    private subscribedBroadcasts: { [slug: string]: boolean };

    static processToRedisChannel(processName: string) {
        return ":receiver/" + processName;
    }

    static broadcastToRedisChannel(target: string, broadcastName: string) {
        return `:broadcast/${target}/${broadcastName}`;
    }

    /**
     * @param processName - The unique name of this process.
     */
    constructor(public processName: string) {
        super();
        this.redisChannel = InfraConnection.processToRedisChannel(processName);
        this.logger = app.logger.getChildLogger({ name: "InfraConn" });
        this.connected = false;
        this.subscribedBroadcasts = {};
    }

    private async onMessagePacketReceived(packetBuf: Buffer) {
        const packet = new ByteArray(packetBuf);
        const sender = packet.readUTF();
        const event = packet.readUTF();

        const buflen = packet.readUnsignedShort();
        const content = buflen > 0 ? packet.readBufBytes(buflen) : Buffer.from("");

        this.emit("messageReceived", { sender, event, content });
    }

    private async onBroadcastPacketReceived(channel: string, packetBuf: Buffer) {
        const packet = new ByteArray(packetBuf);
        const sender = packet.readUTF();

        const buflen = packet.readUnsignedShort();
        const content = buflen > 0 ? packet.readBufBytes(buflen) : Buffer.from("");

        this.emit("broadcastReceived", { sender, channel, content });
    }

    async connect(url: string) {
        this.client = createClient({
            url,
            socket: {
                // Reconnect with a fixed delay (ms)
                reconnectStrategy: () => 1400
            }
        });
        this.pubClient = this.client.duplicate() as ReturnType<typeof createClient>;

        // don't throw on error; just reconnect.
        this.client.on("error", (err) => this.emit("clientError", err));
        await Promise.all([this.client.connect(), this.pubClient.connect()]);

        // ensure no other clients are listening
        var numsubs = (await this.client.pubSubNumSub(this.redisChannel))[this.redisChannel];
        if (numsubs !== 0)
            throw `Attempt to listen on channel ${this.redisChannel} which already had ${numsubs} subscribers. Duplicated process... or hacked?`;

        // subscribe to the receiver channel
        this.client.subscribe(this.redisChannel,
            (message, _channel) => this.onMessagePacketReceived(Buffer.from(message)));

        this.connected = true;
        this.logger.debug("Redis connected.");
    }

    /**
     * @param target - The target name of the process to send to.
     * @param event - The intent of the message.
     * @param message - The message content.
     */
    async sendMessage(target: string, event: string, message?: Buffer) {
        if (!this.connected) {
            throw `Attempt to send ${event} to ${target} without a connection`;
        }

        var packet = new ByteArray();

        packet.writeUTF(this.processName);
        packet.writeUTF(event);
        if (message) {
            packet.writeUnsignedShort(message.length);
            packet.writeBufBytes(message);
        } else {
            packet.writeUnsignedShort(0);
        }

        await this.pubClient.publish(
            InfraConnection.processToRedisChannel(target),
            packet.buffer as unknown as string
        );
    }

    /**
     * Broadcasts a message to all subscribers of a channel.
     * @param channel - The channel of the message to broadcast to.
     * @param message - The message content.
     */
    async broadcastMessage(channel: string, message?: Buffer) {
        if (!this.connected) {
            throw `Attempt to broadcast ${channel} without a connection`;
        }

        var packet = new ByteArray();

        packet.writeUTF(this.processName);
        if (message) {
            packet.writeUnsignedShort(message.length);
            packet.writeBufBytes(message);
        } else {
            packet.writeUnsignedShort(0);
        }

        await this.pubClient.publish(
            InfraConnection.broadcastToRedisChannel(this.processName, channel),
            packet.buffer as unknown as string
        );
    }

    /**
     * Enables broadcast messages from a channel to be received in the `broadcastReceived` event.
     * @param target - The target name of the process to subscribe to.
     * @param channel - The broadcast channel to subscribe to.
     */
    async subscribeBroadcast(target: string, channel: string, listener?: InfraConnectionBroadcast) {
        if (!this.connected) {
            throw `Attempt to subscribe to ${target} broadcast ${channel} without a connection`;
        }

        if (this.subscribedBroadcasts[multislug(target, channel)]) {
            // already subscribed
            return;
        }
        this.subscribedBroadcasts[multislug(target, channel)] = true;

        await this.client.subscribe(
            InfraConnection.broadcastToRedisChannel(target, channel),
            (message, _channel) => this.onBroadcastPacketReceived(channel, Buffer.from(message))
        );
    }

    /**
     * Unsubscribes a channel subscribed by `subscribeBroadcast`.
     * @param target - The target name of the process to unsubscribe from.
     * @param channel - The broadcast channel to unsubscribe from.
     */
    async unsubscribeBroadcast(target: string, channel: string) {
        if (!this.connected) {
            throw `Attempt to unsubscribe from ${target} broadcast ${channel} without a connection`;
        }

        if (!this.subscribedBroadcasts[multislug(target, channel)]) {
            // already unsubscribed
            return;
        }
        delete this.subscribedBroadcasts[multislug(target, channel)];

        await this.client.unsubscribe(
            InfraConnection.broadcastToRedisChannel(target, channel)
        );
    }
}

type KeyType = string | number | symbol;
type ReceiverCallbackType = (content: Buffer, message: InfraConnectionMessage) => void
/**
 * An InfraConnection wrapper to neaten `messageReceived` callbacks using EventEmitter.
 */
export class InfraConnectionMessageReceiver<T extends KeyType = KeyType>
    extends TypedEmitter<{ [_ in T]: ReceiverCallbackType }>
{
    constructor(public conn: InfraConnection) {
        super();
        conn.on("messageReceived", (message) => {
            // @ts-ignore
            this.emit(message.event, message.content, message);
        });
    }
}


export const remote = new InfraConnection("BT800");

remote.on("broadcastReceived", (m) => {
    m.channel
})
//make receiver with unhandled packet
type lss = "dowhisper" | "amongus"
var ff = new InfraConnectionMessageReceiver<lss>(remote)
ff.on("amongus", (a) => { })
//make channel subscriber
