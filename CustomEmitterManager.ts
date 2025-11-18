import { EngineEvents, EventEmitter } from "excalibur";
import { ActorEvents } from "excalibur/build/dist/Actor";

export interface CustomActorEventBus extends ActorEvents {
  myEvent: { myEventData: any };
  testEvent: { testEventData: any };
}

export interface CustomeEngineEventBus extends EngineEvents {}

export const ActorSignals = new EventEmitter<CustomActorEventBus>();

export const EngineSignals = new EventEmitter<CustomeEngineEventBus>();

// publisher
/*
ActorSignals.emit("myEvent", { health: 0 }); // works, and event name shows in intellisense
EngineSignals.emit("testEvent", { keypress: 0 });
*/
// subscriber
/*
ActorSignals.on("myEvent", data => {
  console.log("myEvent", data);
});

EngineSignals.on("testEvent", data => {
  console.log("testEvent", data);
});
*/
