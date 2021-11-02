import glob from "glob";
import path from "path";
import { Client, enums, Identifier } from "transformice.js";
import { promisify } from "util";
import BaseLib from "./BaseLib";
import { DynamicModule, DynamicModuleStatus } from "./DynamicModule";

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

const globAsync = promisify(glob);
async function start() {
    var base = await constructBase();

    // Find the modules
    try {
        var paths = await globAsync(__dirname + "/modules/*.js");
    } catch (e) {
        throw e;
    }

    var modules: DynamicModule[] = [];
    for (let i = 0; i < paths.length; i++) {
        console.log(`try ${paths[i]}`);
        let module_name = "./modules/" + path.basename(paths[i], ".js");
        try {
            let module_def = await import(module_name);
            let module_class = module_def.default as typeof DynamicModule;
            let module = new module_class(base);
            modules.push(module);
            console.debug(`Import ${module_name} (${paths[i]})`);
        } catch (e) {
            console.error(`Couldnt import ${module_name} (${paths[i]}):\n${e.toString()}`);
        }
    }

    for (let i = 0; i < modules.length; i++) {
        let module = modules[i];
        if (module.init && module.init() !== DynamicModuleStatus.OK) {
            console.error(`Fail init ${module.constructor.name}`);
            continue;
        }

        if (module.load && module.load() !== DynamicModuleStatus.OK) {
            console.error(`Fail load ${module.constructor.name}`);
            continue;
        }

        console.log(`Successfully loaded ${module.constructor.name}`)
    }

    console.log("Starting...");
    base.client.run();
}

process.nextTick(start);
