import { Identifier } from "@cheeseformice/transformice.js";
import ClientEvents from "@cheeseformice/transformice.js/dist/client/Events";
import BaseLib from "BaseLib";
import { DynamicModule, DynamicModuleError } from "DynamicModule";
import EventRegistry from "registry/EventRegistry";
import zlib from "zlib";

export default class Bt800Heart extends DynamicModule {
    private clientReg: EventRegistry<ClientEvents>;
    constructor(base: BaseLib) {
        super(base);
        this.clientReg = new EventRegistry(base.client);
    }

    load() {
        var clientReg = this.clientReg;

        clientReg.on("ready", () => {
            console.log("ready!");
        });

        clientReg.on("rawPacket", (conn, ccc, packet) => {
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

        clientReg.on("connect", (conn) => {
            console.log("establish conn", conn.socket.remoteAddress, conn.socket.remotePort);
        });

        clientReg.on("restart", () => {
            console.log("restarting!");
            console.trace();
        });

        clientReg.on("loginError", (code, err1, err2) => {
            // code
            // 1: already connected
            // 2: incorrect
            console.error("Login err", code, err1, err2);
        });

        clientReg.on("connectionError", (err) => {
            console.error("Connection err", err);
        });

        return DynamicModuleError.OK;
    }

    unload() {
        this.clientReg.removeAllListeners();
        return DynamicModuleError.OK;
    }
}
