import { Client, Identifier } from "@cheeseformice/transformice.js";
import { ClientOptions } from "@cheeseformice/transformice.js/dist/client/Client";
import ClientEvents from "@cheeseformice/transformice.js/dist/client/Events";
import { ByteArray, Connection } from "@cheeseformice/transformice.js/dist/utils";
import { LongTextPopup, ServerMessage } from "./structures";

export interface ExtClientEvents extends ClientEvents {

    /// -----------------
    /// UPSTREAM
    /// -----------------

    htmlMessage: (message: string) => void;
    serverMessage: (message: ServerMessage) => void;
    longTextPopup: (popup: LongTextPopup) => void;
}

declare interface ExtClient {
    on<T extends keyof ExtClientEvents>(event: T, listener: ExtClientEvents[T]): this;
    once<T extends keyof ExtClientEvents>(event: T, listener: ExtClientEvents[T]): this;
    emit<T extends keyof ExtClientEvents>(event: T, ...args: Parameters<ExtClientEvents[T]>): boolean;
}

class ExtClient extends Client {
    startTimestamp: number;

    constructor(name: string, password: string, options?: ClientOptions) {
        super(name, password, options);
        this.startTimestamp = -1;

        this.on("login", this.onLogin);
    }

    get uptime() {
        return Date.now() - this.startTimestamp;
    }

    private onLogin() {
        this.startTimestamp = Date.now();
    }

    protected handlePacket(conn: Connection, packet: ByteArray) {
        super.handlePacket(conn, packet);
        packet.readPosition = 0;

        const ccc = packet.readUnsignedShort();
        switch (ccc) {
            // AS3 HTML message
            case Identifier(6, 9): {
                const content = packet.readUTF();
                this.emit("htmlMessage", content);
                break;
            }
            // Server message
            case Identifier(6, 20): {
                const inChannel = packet.readBoolean();
                const content = packet.readUTF();
                const argslen = packet.readByte();
                const args = new Array(argslen).map(() => packet.readUTF());
                this.emit("serverMessage", new ServerMessage(this, inChannel, content, args));
                break;
            }
            // Long text popup
            case Identifier(28, 46): {
                const contentType  = packet.readByte();
                const key = packet.readUTF();
                const contentLen = (packet.readUnsignedByte() & 255) << 16 | (packet.readUnsignedByte() & 255) << 8 | packet.readUnsignedByte() & 255;
                const content = packet.readBufBytes(contentLen).toString();
                this.emit("longTextPopup", new LongTextPopup(this, contentType, content, key));
                break;
            }
        }
    }
}

export { ExtClient };
