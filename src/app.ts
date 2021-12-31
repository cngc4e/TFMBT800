import { enums } from "@cheeseformice/transformice.js";
import { ConnectionSettings } from "@cheeseformice/transformice.js/dist/client/Client";
import { Language } from "@cheeseformice/transformice.js/dist/enums";
import { ExtClient } from "client/client";
import { LoggerWithoutCallSite } from "tslog";

/**
 * The Transformice client
 */
export const client = new ExtClient(process.env.TFM_USER ?? "User", process.env.TFM_PASS ?? "pass123", {
    language: process.env.TFM_LANG as Language ?? enums.Language.en,
    loginRoom: "*#cbase bot bt",
    connectionSettings: async () => {
        let settings: ConnectionSettings;
        try {
            settings = await ExtClient.fetchIP();
        } catch (e) {
            logger.error("Failed to fetch IP from endpoint, going for default fallback...");
            settings = {
                ip: "37.187.29.8",
                ports: [11801, 12801, 13801, 14801]
            }
        }
        return settings;
    },
    autoReconnect: false
});

/**
 * Generic logger
 */
export const logger = new LoggerWithoutCallSite({
    displayFunctionName: false,
    displayFilePath: "hidden"
});

// Expose primary logging functions
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
