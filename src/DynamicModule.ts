import BaseLib from "./BaseLib";

export enum DynamicModuleStatus {
    OK,
    FAILED,
    EXCEPTION
}

/**
 * A module that can be dynamically loaded,
 */
declare interface DynamicModule {
    init?(): DynamicModuleStatus;
	load(): DynamicModuleStatus;
	unload(): DynamicModuleStatus;
}

class DynamicModule {
    /**
     * Base library for the module
     */
    protected base: BaseLib;

    constructor(base: BaseLib) {
        this.base = base;
    }
}

export { DynamicModule };