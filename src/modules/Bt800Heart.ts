import { Identifier } from "@cheeseformice/transformice.js";
import { ByteArray, Connection } from "@cheeseformice/transformice.js/dist/utils";
import zlib from "zlib";
import BaseLib from "../BaseLib";
import { DynamicModule, DynamicModuleStatus } from "../DynamicModule";
import EventRegistry from "../EventRegistry";

export default class Bt800Heart extends DynamicModule {
    private evtReg: EventRegistry;
    constructor(base: BaseLib) {
        super(base);
        this.evtReg = new EventRegistry();
    }

    load() {
        var evtReg = this.evtReg;
        var client = this.base.client;

        evtReg.on(client, "ready", () => {
            console.log("ready!");
        });

        evtReg.on(client, "rawPacket", (conn: Connection, ccc: number, packet: ByteArray) => {
            packet.readPosition = 2;
            switch (ccc) {
                case Identifier(4, 3): {
                    //let objs = ShamanObject.fromPacket4_3(packet);
                    //console.dir(objs);
                    break;
                }
                case Identifier(5, 2): {
                    let map_code = packet.readInt();
                    let num_players = packet.readShort();
                    let round_code = packet.readByte();
                    let enclen = packet.readInt();

                    console.log("map_code", map_code);
                    console.log("# of players", num_players);
                    console.log("round number", round_code);

                    if (enclen > 0) {
                        let encxml = packet.readBufBytes(enclen);
                        console.log("length encxml:", encxml.length);
                        console.log(zlib.inflateSync(encxml).toString());
                    }

                    console.log("author", packet.readUTF());
                    console.log("perm", packet.readByte());
                    //console.log("? bool", packet.readBool());
                    break;
                }
            }
            //console.log("receive",IdentifierSplit(ccc))
            //console.log(packet.toString())
        });

        evtReg.on(client, "connect", (conn: Connection) => {
            console.log("establish conn", conn.socket.remoteAddress, conn.socket.remotePort);
        });

        evtReg.on(client, "restart", () => {
            console.log("restarting!");
            console.trace();
        });

        evtReg.on(client, "loginError", (code: number, err1: string, err2: string) => {
            // code
            // 1: already connected
            // 2: incorrect
            console.error("Login err", code, err1, err2);
        });

        evtReg.on(client, "connectionError", (err: Error) => {
            console.error("Connection err", err);
        });

        return DynamicModuleStatus.OK;
    }

    unload() {
        this.evtReg.removeAllListeners();
        return DynamicModuleStatus.OK;
    }
}
