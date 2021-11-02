"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const transformice_js_1 = require("transformice.js");
const util_1 = require("util");
const BaseLib_1 = __importDefault(require("./BaseLib"));
const DynamicModule_1 = require("./DynamicModule");
function constructBase() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        var client = new transformice_js_1.Client((_a = process.env.TFM_USER) !== null && _a !== void 0 ? _a : "User", (_b = process.env.TFM_PASS) !== null && _b !== void 0 ? _b : "pass123", {
            language: transformice_js_1.enums.languages.en,
            loginRoom: "*#cbase bot bt",
            autoReconnect: false
        });
        var base = new BaseLib_1.default();
        base.client = client;
        return base;
    });
}
const globAsync = (0, util_1.promisify)(glob_1.default);
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        var base = yield constructBase();
        try {
            var paths = yield globAsync(__dirname + "/modules/*.js");
        }
        catch (e) {
            throw e;
        }
        var modules = [];
        for (let i = 0; i < paths.length; i++) {
            console.log(`try ${paths[i]}`);
            let module_name = "./modules/" + path_1.default.basename(paths[i], ".js");
            try {
                let module_def = yield Promise.resolve().then(() => __importStar(require(module_name)));
                let module_class = module_def.default;
                let module = new module_class(base);
                modules.push(module);
                console.debug(`Import ${module_name} (${paths[i]})`);
            }
            catch (e) {
                console.error(`Couldnt import ${module_name} (${paths[i]}):\n${e.toString()}`);
            }
        }
        for (let i = 0; i < modules.length; i++) {
            let module = modules[i];
            if (module.init && module.init() !== DynamicModule_1.DynamicModuleStatus.OK) {
                console.error(`Fail init ${module.constructor.name}`);
                continue;
            }
            if (module.load && module.load() !== DynamicModule_1.DynamicModuleStatus.OK) {
                console.error(`Fail load ${module.constructor.name}`);
                continue;
            }
            console.log(`Successfully loaded ${module.constructor.name}`);
        }
        console.log("Starting...");
        base.client.run();
    });
}
process.nextTick(start);
