import { logger } from "app";
import glob from "glob";
import path from "path";
import { promisify } from "util";
import { DynamicModule, DynamicModuleStateFlag } from "./DynamicModule";

const MODULE_PATHS = ["modules", "priv_modules"];
const globAsync = promisify(glob);

var loadableModules: {
    [moduleName: string]: DynamicModule
} = {};

export async function loadModules() {
    var modules: DynamicModule[] = [];

    // Import modules
    await Promise.all(MODULE_PATHS.map(async (folder) => {
        logger.info("Loading modules from folder: " + folder);

        // Find the modules in this folder
        var paths = await globAsync(`${__dirname}/${folder}/*.js`);

        await Promise.all(paths.map(async (modulePath) => {
            let module_name = `./${folder}/` + path.basename(modulePath);
            try {
                let module_def = await import(module_name);
                if (!(module_def.default instanceof DynamicModule))
                    throw `Not a DynamicModule!`;
                let module = module_def.default as DynamicModule;
                modules.push(module);
                logger.debug(`Import ${module_name} (${modulePath})`);
            } catch (e) {
                logger.error(`Couldnt import ${module_name} (${modulePath}):\n${e.toString()}`);
            }
        }));
    }));

    // Init modules
    await Promise.all(modules.map(async (module) => {
        // Colliding name
        if (loadableModules[module.name]) {
            console.error(`Cannot load module with colliding name: ${module.name}`);
            module.state |= DynamicModuleStateFlag.FAILURE;
            return;
        }
        if (!await module.init()) {
            return;
        }
        // Add on to the list of loadables
        loadableModules[module.constructor.name] = module;
    }));

    // Load modules by default
    await Promise.all(modules.map(async (module) => {
        if (module.ops.autoLoad === false) return;
        await module.load();
    }));
}

export async function loadModuleName(moduleName: string): Promise<boolean> {
    let module = loadableModules[moduleName];
    if (!module) {
        return false;
    }

    logger.info("Request to load module:", moduleName);

    // Init if not done
    if ((module.state & DynamicModuleStateFlag.INIT_DONE) === 0) {
        if (!await module.init()) {
            return false;
        }
    }

    // Load
    await module.load();
    return (module.state & DynamicModuleStateFlag.LOADED) !== 0;
}

export async function unloadModuleName(moduleName: string): Promise<boolean> {
    let module = loadableModules[moduleName];
    if (!module) {
        return false;
    }

    logger.info("Request to unload module:", moduleName);

    // Load
    await module.unload();
    return (module.state & DynamicModuleStateFlag.LOADED) === 0;
}
