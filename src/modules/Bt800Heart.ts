import { Identifier } from "@cheeseformice/transformice.js";
import ClientEvents from "@cheeseformice/transformice.js/dist/client/Events";
import * as app from "app";
import { DynamicModule, DynamicModuleError } from "DynamicModule";
import EventRegistry from "registry/EventRegistry";
import zlib from "zlib";

var clientReg: EventRegistry<ClientEvents>;

export default new DynamicModule({
    name: "Bt800Heart",

    async init() {
        clientReg = new EventRegistry(app.client);
        return DynamicModuleError.OK;
    },

    async load() {
        clientReg.on("ready", () => {
            this.logger.info("ready!");
        });

        clientReg.on("rawPacket", (conn, ccc, packet) => {
            packet.readPosition = 2;
            switch (ccc) {
                case Identifier(5, 2): {
                    let map_code = packet.readInt();
                    let num_players = packet.readShort();
                    let round_code = packet.readByte();
                    let enclen = packet.readInt();

                    this.logger.info("map_code", map_code);
                    this.logger.info("# of players", num_players);
                    this.logger.info("round number", round_code);

                    if (enclen > 0) {
                        let encxml = packet.readBufBytes(enclen);
                        this.logger.info("length encxml:", encxml.length);
                        this.logger.info(zlib.inflateSync(encxml).toString());
                    }

                    this.logger.info("author", packet.readUTF());
                    this.logger.info("perm", packet.readByte());
                    //this.logger.info("? bool", packet.readBool());
                    break;
                }
            }
            //this.logger.info("receive",IdentifierSplit(ccc))
            //this.logger.info(packet.toString())
        });

        clientReg.on("connect", (conn) => {
            this.logger.info("establish conn", conn.socket.remoteAddress, conn.socket.remotePort);
        });

        clientReg.on("restart", () => {
            this.logger.info("restarting!");
            this.logger.trace();
        });

        clientReg.on("loginError", (code, err1, err2) => {
            // code
            // 1: already connected
            // 2: incorrect
            this.logger.error("Login err", code, err1, err2);
        });

        clientReg.on("connectionError", (err) => {
            this.logger.error("Connection err", err);
        });

        return DynamicModuleError.OK;
    },

    async unload() {
        clientReg.removeAllListeners();
        return DynamicModuleError.OK;
    }
});
