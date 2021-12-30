import { enums } from "@cheeseformice/transformice.js";
import { Language } from "@cheeseformice/transformice.js/dist/enums";
import { ExtClient } from "client/client";
import { LoggerWithoutCallSite } from "tslog";

/**
 * The Transformice client
 */
export const client = new ExtClient(process.env.TFM_USER ?? "User", process.env.TFM_PASS ?? "pass123", {
    language: process.env.TFM_LANG as Language ?? enums.Language.en,
    loginRoom: "*#cbase bot bt",
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
