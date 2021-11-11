import { LoggerWithoutCallSite } from "tslog";
import * as app from "./app";

export enum DynamicModuleError {
    OK,
    INIT_ONLY,
    FAILED
}

export enum DynamicModuleStateFlag {
    INIT_DONE = 1 << 0,
    LOADED    = 1 << 1,
    FAILURE   = 1 << 2
}

/**
 * A module that can be dynamically loaded,
 */
interface DynamicModuleOps {
    name: string;
    // Defines if the module will start automatically when the bot comes up.
    // autoStart?: boolean;
    init?(this: DynamicModule): Promise<DynamicModuleError>;
    load?(this: DynamicModule): Promise<DynamicModuleError>;
    unload?(this: DynamicModule): Promise<DynamicModuleError>;
}

export class DynamicModule {
    public name: string;
    public logger: LoggerWithoutCallSite;
    public state: DynamicModuleStateFlag;
    public ops: DynamicModuleOps;

    constructor(moduleOps: DynamicModuleOps) {
        this.name = moduleOps.name;
        this.logger = app.logger.getChildLogger({
            name: this.name
        });
        this.state = 0;
        this.ops = moduleOps;
    }

    async init() {
        if (this.ops.init) {
            let status = await this.ops.init.bind(this)();
            if (status === DynamicModuleError.INIT_ONLY) {
                // Module is init-only. Don't proceed futher.
                this.logger.info(`Finished loading the init-only module.`);
                this.state |= DynamicModuleStateFlag.INIT_DONE;
                return false;
            } else if (status !== DynamicModuleError.OK) {
                this.logger.error(`Failed init.`);
                this.state |= DynamicModuleStateFlag.FAILURE;
                return false;
            }
        }
        this.logger.debug(`Initiated.`);
        this.state |= DynamicModuleStateFlag.INIT_DONE;
        return true;
    }

    async load() {
        // Don't load unless init stage has completed
        if ((this.state & DynamicModuleStateFlag.INIT_DONE) === 0) {
            this.logger.error(`Attempt to load an uninitialized module!`);
            return false;
        }

        if (this.ops.load && await this.ops.load.bind(this)() !== DynamicModuleError.OK) {
            this.logger.error(`Failed loading.`);
            this.state |= DynamicModuleStateFlag.FAILURE;
            return false;
        }

        this.state &= ~DynamicModuleStateFlag.FAILURE;
        this.state |= DynamicModuleStateFlag.LOADED;
        this.logger.info(`Successfully loaded.`);
        return true;
    }

    async unload() {
        if ((this.state & DynamicModuleStateFlag.LOADED) === 0) {
            this.logger.error(`Module is already unloaded, not unloading again.`);
            return false;
        }

        if (this.ops.unload && await this.ops.unload.bind(this)() !== DynamicModuleError.OK) {
            this.logger.error(`Failed unload.`);
            this.state |= DynamicModuleStateFlag.FAILURE;
            return false;
        }

        this.state &= ~(DynamicModuleStateFlag.FAILURE | DynamicModuleStateFlag.LOADED);
        this.logger.info(`Successfully unloaded.`);
        return true;
    }
}

new DynamicModule({
    name: "sa",
    async load() {

        return DynamicModuleError.OK
    }
})