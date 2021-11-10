import { EventEmitter } from "events";

/**
 * Keeps track of EventEmitter listeners and automatically removes them upon selected events.
 *
 * Based on EventRegistry (https://www.npmjs.com/package/event-registry), but simplified with
 * TypeScript support.
 */
class EventRegistry<Events> {
    private trackedDynEes: {
        eventName: string | symbol,
        listener: (...args: any[]) => void
    }[] = [];
    public emitter: EventEmitter;

    constructor(emitter: EventEmitter) {
        this.emitter = emitter;
    }

    on<E extends keyof Events>(eventName_: E, listener_: Events[E]) {
        var eventName = eventName_ as typeof this.trackedDynEes[number]["eventName"];
        var listener = listener_ as unknown as typeof this.trackedDynEes[number]["listener"];

        this.trackedDynEes.push({ eventName, listener });
        this.emitter.on(eventName, listener);
        return this;
    }

    removeAllListeners() {
        for (let i = 0; i < this.trackedDynEes.length; i++) {
            let dyn_ee = this.trackedDynEes[i];
            this.emitter.off(dyn_ee.eventName, dyn_ee.listener);
        }
    }
}

export default EventRegistry;
