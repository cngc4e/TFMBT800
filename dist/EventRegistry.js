"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventRegistry {
    constructor() {
        this.trackedDynEes = [];
    }
    on(emitter, ...args) {
        var eventName = args[0];
        var listener = args[1];
        this.trackedDynEes.push({ ee: emitter, eventName: eventName, listener: listener });
        emitter.on(eventName, listener);
        return this;
    }
    removeAllListeners() {
        for (let i = 0; i < this.trackedDynEes.length; i++) {
            let dyn_ee = this.trackedDynEes[i];
            dyn_ee.ee.off(dyn_ee.eventName, dyn_ee.listener);
        }
    }
}
exports.default = EventRegistry;
