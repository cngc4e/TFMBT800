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

const MODULE_PATHS = ["modules", "priv_modules"];
const globAsync = promisify(glob);
async function loadModules(base: BaseLib) {
    var modules: DynamicModule[] = [];

    for (let n_m = 0; n_m < MODULE_PATHS.length; n_m++) {
        let folder = MODULE_PATHS[n_m];

        console.log("Loading modules from folder: " + folder);

        // Find the modules in this folder
        try {
            var paths = await globAsync(`${__dirname}/${folder}/*.js`);
        } catch (e) {
            throw e;
        }

        for (let i = 0; i < paths.length; i++) {
            //console.log(`try ${paths[i]}`);
            let module_name = `./${folder}/` + path.basename(paths[i], ".js");
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
    }

    return modules;
}

async function start() {
    var base = await constructBase();
    var modules = await loadModules(base);

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
