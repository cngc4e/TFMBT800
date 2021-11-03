import BaseLib from "./BaseLib";

export enum DynamicModuleError {
    OK,
    FAILED,
    EXCEPTION
}

export enum DynamicModuleStateFlag {
    INIT_DONE = 1 << 0,
    LOADED    = 1 << 1,
    FAILURE   = 1 << 2
}

/**
 * A module that can be dynamically loaded,
 */
declare interface DynamicModule {
    init?(): DynamicModuleError;
    load?(): DynamicModuleError;
    unload?(): DynamicModuleError;
}

class DynamicModule {
    /**
     * Base library for the module
     */
    protected base: BaseLib;
    public state: DynamicModuleStateFlag;

    constructor(base: BaseLib) {
        this.base = base;
        this.state = 0;
    }
}

export { DynamicModule };