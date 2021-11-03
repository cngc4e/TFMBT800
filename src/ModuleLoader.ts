import glob from "glob";
import path from "path";
import { promisify } from "util";
import BaseLib from "./BaseLib";
import { DynamicModule, DynamicModuleError, DynamicModuleStateFlag } from "./DynamicModule";

const MODULE_PATHS = ["modules", "priv_modules"];
const globAsync = promisify(glob);

var loadableModules: {
    [moduleName: string]: DynamicModule
} = {};

export async function loadModules(base: BaseLib) {
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

    for (let i = 0; i < modules.length; i++) {
        let module = modules[i];

        if (!module.constructor?.name) {
            console.error(`Cannot load module: ${module}`);
            module.state |= DynamicModuleStateFlag.FAILURE;
            continue;
        }

        // Colliding name
        if (loadableModules[module.constructor.name]) {
            console.error(`Cannot load module with colliding name: ${module.constructor.name}`);
            module.state |= DynamicModuleStateFlag.FAILURE;
            continue;
        }

        if (module.init && module.init() !== DynamicModuleError.OK) {
            console.error(`Fail init: ${module.constructor.name}`);
            module.state |= DynamicModuleStateFlag.FAILURE;
            continue;
        }

        module.state |= DynamicModuleStateFlag.INIT_DONE;
        // Add on to the list of loadables
        loadableModules[module.constructor.name] = module;
    }

    for (let i = 0; i < modules.length; i++) {
        let module = modules[i];

        // Don't load unless init stage has completed
        if ((module.state & DynamicModuleStateFlag.INIT_DONE) == 0) {
            continue;
        }

        if (module.load && module.load() !== DynamicModuleError.OK) {
            console.error(`Fail load: ${module.constructor.name}`);
            module.state |= DynamicModuleStateFlag.FAILURE;
            continue;
        }

        module.state &= ~DynamicModuleStateFlag.FAILURE;
        module.state |= DynamicModuleStateFlag.LOADED;
        console.log(`Successfully loaded ${module.constructor.name}`);
    }
}

export async function loadModuleName(moduleName: string): Promise<boolean> {
    let module = loadableModules[moduleName];
    if (!module) {
        return false;
    }

    console.log("Request to load module:", moduleName);

    // Init if not done
    if ((module.state & DynamicModuleStateFlag.LOADED) == 0) {
        if (module.init && module.init() !== DynamicModuleError.OK) {
            console.error(`Fail init: ${module.constructor.name}`);
            module.state |= DynamicModuleStateFlag.FAILURE;
            return false;
        }
    }

    // Load
    if (module.load && module.load() !== DynamicModuleError.OK) {
        console.error(`Fail load: ${module.constructor.name}`);
        module.state |= DynamicModuleStateFlag.FAILURE;
        return false;
    }

    module.state &= ~DynamicModuleStateFlag.FAILURE;
    module.state |= DynamicModuleStateFlag.LOADED;
    console.log(`Successfully loaded ${module.constructor.name}`);
    return true;
}

export async function unloadModuleName(moduleName: string): Promise<boolean> {
    let module = loadableModules[moduleName];
    if (!module) {
        return false;
    }

    console.log("Request to unload module:", moduleName);

    if ((module.state & DynamicModuleStateFlag.LOADED) == 0) {
        console.error(`Module ${moduleName} is already unloaded, not unloading again.`);
        return false;
    }

    // Load
    if (module.unload && module.unload() !== DynamicModuleError.OK) {
        console.error(`Fail unload: ${module.constructor.name}`);
        module.state |= DynamicModuleStateFlag.FAILURE;
        return false;
    }

    module.state &= ~(DynamicModuleStateFlag.FAILURE | DynamicModuleStateFlag.LOADED);
    console.log(`Successfully unloaded ${module.constructor.name}`);
    return true;
}
