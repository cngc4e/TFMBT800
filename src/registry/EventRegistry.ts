import { EventEmitter } from "events";

// TODO: is there a neat way to provide EventEmitter autocompletion?
// declare interface EventRegistry {
//     on<T extends EventEmitter>(emitter: T, event: Parameters<T["on"]>[0],
//            listener: Parameters<T["on"]>[1])
//     on<T extends EventEmitter, F extends T["on"], A extends Parameters<F>[0]>(
//        emitter: T,
//        event: A,
//        listener: T["on"]<"roomPlayerDie">[1]
//        ):this;
// }

/**
 * Keeps track of EventEmitter listeners and automatically removes them upon selected events.
 *
 * Based on EventRegistry (https://www.npmjs.com/package/event-registry), but simplified with
 * TypeScript support.
 */
class EventRegistry {
    private trackedDynEes: {
        ee: EventEmitter,
        eventName: string | symbol,
        listener: (...args: any[]) => void
    }[] = [];


    //on(emitter: EventEmitter, eventName: string | symbol, listener: (...args: any[]) => void) {
    on<T extends EventEmitter, F extends T["on"]>(emitter: T, ...args: Parameters<F>) {
        var eventName = args[0] as string | symbol;
        var listener = args[1] as (...args: any[]) => void;

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

export default EventRegistry;
