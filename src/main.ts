import { Client, enums } from "@cheeseformice/transformice.js";
import BaseLib from "./BaseLib";
import { loadModules } from "./ModuleLoader";

async function constructBase() {
    var client = new Client(process.env.TFM_USER ?? "User", process.env.TFM_PASS ?? "pass123", {
        language: enums.languages.en,
        loginRoom: "*#cbase bot bt",
        autoReconnect: false
    });

    var base = new BaseLib();
    base.client = client;

    return base;
}

async function start() {
    var base = await constructBase();

    await loadModules(base);

    console.log("Starting...");
    base.client.run();
}

process.nextTick(start);
