import * as app from "app";
import { createClient } from "redis";
import { TypedEmitter } from "tiny-typed-emitter";
import { ByteArray } from "utils/byteArray";

interface InfraConnectionEvents {
    /**
     * Message sent to this process.
     */
    messageReceived: (message: InfraConnectionMessage) => void;
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

    static processToRedisChannel(processName: string) {
        return ":receiver/" + processName;
    }

    static broadcastToRedisChannel(broadcastName: string) {
        return ":broadcast/" + broadcastName;
    }

    /**
     * @param processName - The unique name of this process.
     */
    constructor(public processName: string) {
        super();
        this.redisChannel = InfraConnection.processToRedisChannel(processName);
        this.logger = app.logger.getChildLogger({ name: "InfraConn" });
        this.connected = false;
    }

    private async onPacketReceived(packetBuf: Buffer) {
        const packet = new ByteArray(packetBuf);
        const sender = packet.readUTF();
        const event = packet.readUTF();

        const buflen = packet.readUnsignedShort();
        const content = buflen > 0 ? packet.readBufBytes(buflen) : Buffer.from("");

        this.emit("messageReceived", { sender, event, content });
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

        // ensru
        // subscribe to the receiver channel
        this.client.subscribe(this.redisChannel,
            (message, _channel) => this.onPacketReceived(Buffer.from(message)));

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
    async broadcastMessage(channel: string, message: Buffer) {
        if (!this.connected) {
            throw `Attempt to broadcast ${channel} without a connection`;
        }

        var packet = new ByteArray();

        packet.writeUTF(this.processName);
        packet.writeUnsignedShort(message.length);
        packet.writeBufBytes(message);

        await this.pubClient.publish(
            InfraConnection.broadcastToRedisChannel(channel),
            packet.buffer as unknown as string
        );
    }
}

export const remote = new InfraConnection("BT800");

//make receiver with unhandled packet
//make channel subscriber
