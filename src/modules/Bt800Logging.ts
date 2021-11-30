import ClientEvents from "@cheeseformice/transformice.js/dist/client/Events";
import * as app from "app";
import { DynamicModule, DynamicModuleError } from "DynamicModule";
import EventRegistry from "registry/EventRegistry";

var clientReg: EventRegistry<ClientEvents>;

export default new DynamicModule({
    name: "Bt800Logging",

    async init() {
        clientReg = new EventRegistry(app.client);
        return DynamicModuleError.OK;
    },

    async load() {
        clientReg.on("ready", () => {
            this.logger.info("ready! connected to CP");
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

        return DynamicModuleError.OK;
    },

    async unload() {
        clientReg.removeAllListeners();
        return DynamicModuleError.OK;
    }
});
