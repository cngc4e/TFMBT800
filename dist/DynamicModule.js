"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicModule = exports.DynamicModuleStatus = void 0;
var DynamicModuleStatus;
(function (DynamicModuleStatus) {
    DynamicModuleStatus[DynamicModuleStatus["OK"] = 0] = "OK";
    DynamicModuleStatus[DynamicModuleStatus["FAILED"] = 1] = "FAILED";
    DynamicModuleStatus[DynamicModuleStatus["EXCEPTION"] = 2] = "EXCEPTION";
})(DynamicModuleStatus = exports.DynamicModuleStatus || (exports.DynamicModuleStatus = {}));
class DynamicModule {
    constructor(base) {
        this.base = base;
    }
}
exports.DynamicModule = DynamicModule;
