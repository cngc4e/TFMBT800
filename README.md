# Bt800 Transformice Bot
Contains open source code bits for the Bt800 bot in Transformice. Under the hood, the bot is built upon [transformice.js](https://github.com/cheeseformice/transformice.js).

## Install & Run
Copy `.env.sample` to `.env` and edit it with your credentials. Note that the account used must be approved for bot usage or login will fail.

```
npm i
npm run start
```

## Modular
The design of this bot is modular, meaning it's possible to dynamically load extended functionality from segregated files with defined load & unload routines.

Modules ending with .ts are loaded in the following folders:
- `src/modules`
- `src/priv_modules`

These modules must extend the `DynamicModule` interface and implement `load` and `unload` functionalities. See `src/modules` for examples.

## Pitfall
Unfortunately, the design lacks the convenience of intellisense type auto inference in the `Client` event emitter. You must explicitly specify the parameter types. I am not sure if it's possible to fully port the functionality over to `EventRegistry`.

With `Client`:
```ts
// Supports type inference on `message`
client.on("roomMessage", (message) => {});
```

With `EventRegistry`:
```ts
// DOes not support type inference on `message`
this.evtReg.on(client, "roomMessage", (message: RoomMessage) => {});
```
