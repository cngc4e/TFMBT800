"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transformice_js_1 = require("transformice.js");
const zlib_1 = __importDefault(require("zlib"));
const DynamicModule_1 = require("../DynamicModule");
const EventRegistry_1 = __importDefault(require("../EventRegistry"));
class Bt800Heart extends DynamicModule_1.DynamicModule {
    constructor(base) {
        super(base);
        this.evtReg = new EventRegistry_1.default();
    }
    load() {
        var evtReg = this.evtReg;
        var client = this.base.client;
        evtReg.on(client, "roomMessage", (message) => {
            if (client.name === message.author.name)
                return;
            if (message.content.match("allplank"))
                client.sendRoomMessage("retard");
            if (message.content.match("cat"))
                client.sendRoomMessage("woof");
            if (message.content.match("meow"))
                client.sendRoomMessage("moo");
            if (message.content.match("rini"))
                client.sendRoomMessage("scary as always");
            if (message.content.match(/\b(bt|buildtool)/mi))
                client.sendRoomMessage("bt rocks!");
            if (message.content.match("boss"))
                client.sendRoomMessage("boss lynn durand sp beside jiren camp");
        });
        evtReg.on(client, "ready", () => {
            console.log("ready!");
        });
        evtReg.on(client, "rawPacket", (conn, ccc, packet) => {
            packet.readPosition = 2;
            switch (ccc) {
                case (0, transformice_js_1.Identifier)(4, 3): {
                    break;
                }
                case (0, transformice_js_1.Identifier)(5, 2): {
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
                        console.log(zlib_1.default.inflateSync(encxml).toString());
                    }
                    console.log("author", packet.readUTF());
                    console.log("perm", packet.readByte());
                    break;
                }
            }
        });
        evtReg.on(client, "roomMessage", (message) => {
            console.log(`[${message.author.name}] ${message.content}`);
        });
        evtReg.on(client, "roomChange", (newRoom) => {
            client.sendRoomMessage("hi ! 😀");
        });
        evtReg.on(client, "connect", (conn) => {
            console.log("establish conn", conn.socket.remoteAddress, conn.socket.remotePort);
        });
        evtReg.on(client, "restart", () => {
            console.log("restarting!");
            console.trace();
        });
        evtReg.on(client, "loginError", (code, err1, err2) => {
            console.error("Login err", code, err1, err2);
        });
        evtReg.on(client, "connectionError", (err) => {
            console.error("Connection err", err);
        });
        return DynamicModule_1.DynamicModuleStatus.OK;
    }
    unload() {
        this.evtReg.removeAllListeners();
        return DynamicModule_1.DynamicModuleStatus.OK;
    }
}
exports.default = Bt800Heart;
